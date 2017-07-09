<?php

namespace Fuga\PublicBundle\Controller;

use Fuga\CommonBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;

class CabinController extends Controller
{
	public function index()
	{
		$user = $this->getManager('Fuga:Common:User')->getCurrentUser();
		if (!$user || $user['group_id'] == FAN_GROUP) {
			return $this->redirect('/');
		}

		if ($user['is_tested'] == 0) {
			return $this->redirect('/');
		}

		$messages = $this->get('container')->getItems('cabin_messages', 'publish=1 AND user_id='.$user['id']);

		return $this->render('cabin/index', compact('user', 'messages'));
	}

	public function mainpage()
	{
		$user = $this->get('security')->getCurrentUser();
		if ($user) {
			$gamelink = $this->getManager('Fuga:Common:Param')->findByName('game', 'gamelink');
			if ($gamelink ) {
				if (!$this->get('security')->isGroup('gamer') && !$this->get('security')->isSuperuser()){
					$gamelink = '';
				}
				return $this->render('cabin/message.gamer', compact('gamelink', 'user'));
			} else {
				return $this->render('cabin/message.common');
			}
		}

		return $this->login();
	}

	public function enter()
	{
		if ('POST' == $_SERVER['REQUEST_METHOD']) {

			$login = $this->get('request')->request->get('login');
			$password = $this->get('request')->request->get('password');
			$is_remember = true;

			if (!$login || !$password) {
				$this->get('session')->set('danger', 'Неверный Логин или Пароль');
			} elseif ($this->get('security')->isServer()) {
				$response = $this->get('security')->login($login, $password, $is_remember);
				if ($response) {
					return $response;
				}
				$this->get('session')->set('danger', 'Неверный Логин или Пароль');
			}
		}

		return $this->redirect('/');
	}

	public function login()
	{
		$message = $this->flash('danger');
		if ($this->isXmlHttpRequest()) {
			$response = new JsonResponse();
			$response->setData(array(
				'content' => $this->render('cabin/login', compact('message')),
			));

			return $response;
		}

		return $this->render('cabin/login', compact('message'));
	}

	public function logout()
	{
		$this->get('security')->logout();

		return $this->redirect('/');
	}

	public function register()
	{
		if ('POST' == $_SERVER['REQUEST_METHOD']) {
			$response = new JsonResponse();

			$data = array(
				'group_id' => $this->get('request')->request->getInt('role_id', 3),
				'name' => $this->get('request')->request->get('name'),
				'lastname' => $this->get('request')->request->get('lastname'),
				'nickname' => $this->get('request')->request->get('nickname'),
				'login' => $this->get('request')->request->get('login'),
				'email' => $this->get('request')->request->get('login'),
				'password' => $this->get('request')->request->get('password'),
				'created' => date('Y-m-d H:i:s'),
				'is_active' => 1,
			);

			// validate not empty
			if (empty($data['login']) || empty($data['name'])|| empty($data['lastname'])|| empty($data['nickname'])) {
				$response->setData(array(
					'error' => 'Заполнены не все поля формы',
				));

				return $response;
			}

			// validate login
			$user = $this->get('container')->getItem('user_user', 'email="'.$data['login'].'"');
			if ($user) {
				$response->setData(array(
					'error' => 'Пират с таким логином уже участвует в приключениях',
				));

				return $response;
			}

			// validate password
			$passwordAgain = $this->get('request')->request->get('password_again');
			if (strlen($data['password']) < 6) {
				$response->setData(array(
					'error' => 'Пароль менее 6 символов',
				));

				return $response;
			}
			if ($data['password'] != $passwordAgain) {
				$response->setData(array(
					'error' => 'Пароли не совпадают',
				));

				return $response;
			}

			// validate nickname
			$user = $this->get('container')->getItem('user_user', 'nickname="'.$data['nickname'].'"');
			if ($user) {
				$response->setData(array(
					'error' => 'Пират с таким прозвищем уже участвует в приключениях',
				));

				return $response;
			}

			$roles = $this->get('container')->getItems('pirate_prof', 'quantity>0');

			// validate user group
			if (!in_array($data['group_id'], array(GAMER_GROUP, FAN_GROUP)) || !$roles) {
				$data['group_id'] = FAN_GROUP;
			}

			if ($data['group_id'] == GAMER_GROUP){

				if (!empty($_FILES['avatar']) && !empty($_FILES['avatar']['name'])) {
					$field = $this->get('container')->getTable('user_user')->getFieldType($this->get('container')->getTable('user_user')->fields['avatar']);
					$this->get('imagestorage')->setOptions(['sizes' => $field->getParam('sizes')]);
					$data['avatar'] = $this->get('imagestorage')->save($_FILES['avatar']['name'], $_FILES['avatar']['tmp_name']);
				} else {
					$response->setData(array(
						'error' => 'Аватар обязателен',
					));

					return $response;
				}
			}

			try {
				$this->get('connection')->beginTrans();
				if ($data['group_id'] == GAMER_GROUP){
					if (isset($roles[HELPER_ROLE])) {
						$data['role_id'] = HELPER_ROLE;
						$this->get('connection')->update(
							'pirate_prof',
							array('quantity' => --$roles[HELPER_ROLE]['quantity']),
							array('id' => $roles[HELPER_ROLE]['id'])
						);

						$ship =  array(
							'name' => 'Безымянный',
						);
	//					$data['is_tested'] = 1;
						$data['ship_id'] = $this->get('container')->addItem('crew_ship', $ship);
					} else {
						$keys = array_keys($roles);
						shuffle($keys);
						$key = array_shift($keys);
						$data['role_id'] = $roles[$key]['id'];
						$this->get('connection')->update(
							'pirate_prof',
							array('quantity' => --$roles[$key]['quantity']),
							array('id' => $roles[$key]['id'])
						);
					}
				}

				$password = $data['password'];
				$data['password'] = hash('sha512', $data['password']);

				$userId = $this->get('connection')->insert('user_user', $data);
				$this->get('connection')->commit();
				if ($userId) {
					$text = 'Информационное сообщение сайта '.$_SERVER['SERVER_NAME']."\n";
					$text .= '------------------------------------------'."\n";
					$text .= 'Ваша регистрационная информация:'."\n";
					$text .= 'ID пользователя: '.$userId."\n";
					$text .= 'Логин: '.$data['login']."\n";
					$text .= 'Пароль: '.$password."\n\n";
					$text .= 'Сообщение сгенерировано автоматически.'."\n";
					$this->get('mailer')->send(
						'КОРСАРЫ АНКОРа - регистрационные данные',
						nl2br($text),
						$data['email']
					);
					$this->get('security')->login($data['login'], $password);
				}
			} catch (\Exception $e) {
				$this->get('connection')->rollback();
				$this->err($e->getMessage());
				$response->setData(array(
					'error' => 'Ошибка регистрации. Обратитесь к администратору.',
				));

				return $response;
			}


			$response->setData(array(
				'error' => false,
				'trigger' => 'start-test',
			));

			return $response;
		}

		if ($this->isXmlHttpRequest()) {

			$roles = $this->get('container')->getItems('pirate_prof', 'quantity>0');

			$response = new JsonResponse();
			$response->setData(array(
				'content' => $this->render('cabin/register', compact('roles')),
			));

			return $response;
		}

		return  $this->redirect('/');
	}

	public function forget()
	{
		if ('POST' == $_SERVER['REQUEST_METHOD']) {
			$response = new JsonResponse();

			$login = $this->get('request')->request->get('login');

			if (!$login) {
				$response->setData(array(
					'error' => 'Пользователь для восстановления пароля не найден1 ',
				));

				return $response;
			}
			$user = $this->get('container')->getItem('user_user', 'login="'.$login.'"');

			if ($user) {
				$password = $this->get('util')->genKey();
				$this->get('container')->updateItem(
					'user_user',
					array('hashkey' => '', 'password' => hash('sha512', $password)),
					array('id' => $user['id'])
				);
				$text = 'Информационное сообщение сайта '.$_SERVER['SERVER_NAME']."\n";
				$text .= '------------------------------------------'."\n";
				$text .= 'Вы запросили ваши регистрационные данные.'."\n";
				$text .= 'Ваша регистрационная информация:'."\n";
				$text .= 'ID пользователя: '.$user['id']."\n";
				$text .= 'Логин: '.$user['login']."\n";
				$text .= 'Пароль: '.$password."\n\n";
				$text .= 'Сообщение сгенерировано автоматически.'."\n";
				$this->get('mailer')->send(
					'Новые регистрационные данные. Сайт '.$_SERVER['SERVER_NAME'],
					nl2br($text),
					$user['email']
				);

				$response->setData(array(
					'error' => false,
					'content' => '<h2>Письмо с новым паролем отправлено вам на электронную почту</h2>',
				));

				return $response;
			} else {
				$response->setData(array(
					'error' => 'Пользователь для восстановления пароля не найден2',
				));

				return $response;
			}
		}

		if ($this->isXmlHttpRequest()) {
			$response = new JsonResponse();
			$response->setData(array(
				'content' => $this->render('cabin/forget'),
			));

			return $response;
		}

		return $this->redirect('/');
	}

	public function passchange()
	{
		if ('POST' == $_SERVER['REQUEST_METHOD']) {
			$response = new JsonResponse();

			$user = $this->get('security')->getCurrentUser();

			if ($user) {
				$password = $this->get('request')->request->get('password');
				$password_old = $this->get('request')->request->get('password_old');
				$password_again = $this->get('request')->request->get('password_again');
				if (hash('sha512',$password_old) != $user['password']) {
					$response->setData(array(
						'error' => 'Старый пароль указан неверно',
					));

					return $response;
				}

				if ($password != $password_again) {
					$response->setData(array(
						'error' => 'Пароли не совпадают',
					));

					return $response;
				}

				$this->get('container')->updateItem(
					'user_user',
					array('hashkey' => '', 'password' => hash('sha512', $password)),
					array('id' => $user['id'])
				);
				$text = 'Информационное сообщение сайта '.$_SERVER['SERVER_NAME']."\n";
				$text .= '------------------------------------------'."\n";
				$text .= 'Вы запросили ваши регистрационные данные.'."\n";
				$text .= 'Ваша регистрационная информация:'."\n";
				$text .= 'ID пользователя: '.$user['id']."\n";
				$text .= 'Логин: '.$user['login']."\n";
				$text .= 'Пароль: '.$password."\n\n";
				$text .= 'Сообщение сгенерировано автоматически.'."\n";
				$this->get('mailer')->send(
					'Новые регистрационные данные. Сайт '.$_SERVER['SERVER_NAME'],
					nl2br($text),
					$user['email']
				);

				$response->setData(array(
					'error' => false,
					'content' => '<h2>Пароль изменен. Письмо с новым паролем отправлено вам на электронную почту</h2>',
				));

				return $response;
			} else {
				$response->setData(array(
					'error' => 'Пользователь для восстановления пароля не найден',
				));

				return $response;
			}
		}

		if ($this->isXmlHttpRequest()) {
			$response = new JsonResponse();
			$response->setData(array(
				'content' => $this->render('cabin/password'),
			));

			return $response;
		}

		return $this->redirect('/');
	}

	public function current()
	{
		$response = new JsonResponse();
		$response->setData(array(
			'user' => $this->getManager('Fuga:Common:User')->getCurrentUser(),
		));

		return $response;
	}

	public function purse()
	{
		$response = new JsonResponse();

		$user = $this->getManager('Fuga:Common:User')->getCurrentUser();
		if (!$user || $user['group_id'] == FAN_GROUP) {
			$response->setData(array(
				'error' => true,
			));
		}

		$purse = $this->get('request')->request->getInt('purse');

		$this->get('container')->updateItem(
			'user_user',
			array('purse' => $purse),
			array('id' => $user['id'])
		);

		$response->setData(array(
			'error' => false,
		));

		return $response;
	}

	public function test()
	{
		if ($this->isXmlHttpRequest()) {
			$questionId = $this->get('request')->request->get('question');
			$question = $this->get('container')->getItem('question_prof', $questionId);
			$response = new JsonResponse();
			$response->setData(array(
				'content' => $this->render('cabin/question', compact('question')),
			));

			return $response;
		}

		return $this->redirect('/');
	}

	public function prof()
	{
		if ($this->isXmlHttpRequest()) {
			$user = $this->getManager('Fuga:Common:User')->getCurrentUser();
			$this->get('connection')->update(
				'user_user',
				array('is_tested' => 1),
				array('id' => $user['id'])
			);
			if (isset($user['role'])) {
				$prof = $user['role'];
			} else {
				$prof = array(
					'name' => 'Программист',
					'description' =>  'Профессия ваша непонятна окружающим',
				);
			}

			$response = new JsonResponse();
			$response->setData(array(
				'content' => $this->render('cabin/prof', compact('prof')),
			));

			return $response;
		}

		return $this->redirect('/');
	}

	public function ship()
	{
		if ('POST' == $_SERVER['REQUEST_METHOD']) {
			$user = $this->getManager('Fuga:Common:User')->getCurrentUser();
			$data = array(
				'name' => $this->get('request')->request->get('name'),
				'flag' => $this->get('request')->request->getInt('flag', 0),
				'publish' => 1,
			);

			$response = new JsonResponse();

			if (0 == $data['flag']) {
				$response->setData(array(
					'error' => 'Выберите название и флаг корабля',
				));

				return $response;
			}

			try {
				$this->get('connection')->beginTrans();

				$this->get('connection')->update(
					'crew_ship',
					$data,
					array('id' => $user['ship_id'])
				);

				$this->get('connection')->update(
					'crew_flag',
					array('is_used' => 1),
					array('id' => $data['flag'])
				);

				for ($i = 2; $i < 13; $i++){
					$this->get('container')->addItem(
						'crew_vacancy',
						array(
							'ship_id' => $user['ship_id'],
							'role_id' => $i,
							'quantity' => $i == 2 ? 4 : 1,
							'publish' => 1,
						)
					);
				}

				$this->get('connection')->commit();
			} catch (\Exception $e) {
				$this->err($e->getMessage());
				$this->get('connection')->rollback();
			}

			$response->setData(array(
				'content' => $this->render('cabin/register.gamer'),
			));

			return $response;
		}

		if ($this->isXmlHttpRequest()) {
			$flags = $this->get('container')->getItems('crew_flag', 'is_used=0');
			$response = new JsonResponse();
			$response->setData(array(
				'content' => $this->render('cabin/ship', compact('flags')),
			));

			return $response;
		}

		return $this->redirect('/');
	}

	public function avatar()
	{
		if ('POST' == $_SERVER['REQUEST_METHOD']) {
			$response = new JsonResponse();

			$user = $this->getManager('Fuga:Common:User')->getCurrentUser();
			if (!$user || $user['group_id'] == FAN_GROUP) {
				$response->setData(array(
					'error' => true,
				));

				return $response;
			}

			$data = array();

			if (!empty($_FILES['avatar']) && !empty($_FILES['avatar']['name'])) {
				$field = $this->get('container')->getTable('user_user')->getFieldType($this->get('container')->getTable('user_user')->fields['avatar']);
				$this->get('imagestorage')->setOptions(['sizes' => $field->getParam('sizes')]);
				$data['avatar'] = $this->get('imagestorage')->save($_FILES['avatar']['name'], $_FILES['avatar']['tmp_name']);
				$avatar = $this->get('imagestorage')->path($data['avatar']);
			} else {
				$response->setData(array(
					'error' => 'Аватар обязателен',
				));

				return $response;
			}

			try {
				$this->get('connection')->update(
					'user_user',
					$data,
					array('id' => $user['id'])
				);
			} catch (\Exception $e) {
				$this->err($e->getMessage());
				$response->setData(array(
					'error' => 'Ошибка сохранения аватара. Обратитесь к администратору.',
				));

				return $response;
			}

			$response->setData(array(
				'error' => false,
				'avatar' => $avatar,
			));

			return $response;
		}

		if ($this->isXmlHttpRequest()) {

			$response = new JsonResponse();
			$response->setData(array(
				'content' => $this->render('cabin/avatar'),
			));

			return $response;
		}

		return $this->redirect('/');
	}

	public function change()
	{
		if ('POST' == $_SERVER['REQUEST_METHOD']) {
			$response = new JsonResponse();

			$user = $this->getManager('Fuga:Common:User')->getCurrentUser();
			if (!$user || $user['group_id'] == FAN_GROUP) {
				$response->setData(array(
					'error' => true,
				));

				return $response;
			}

			$data = array(
				'nickname' => strip_tags($this->get('request')->request->get('nickname', $user['nickname'])),
				'name' => strip_tags($this->get('request')->request->get('name', $user['name'])),
				'lastname' => strip_tags($this->get('request')->request->get('lastname', $user['lastname'])),
			);



			try {
				$this->get('connection')->update(
					'user_user',
					$data,
					array('id' => $user['id'])
				);
			} catch (\Exception $e) {
				$this->err($e->getMessage());
				$response->setData(array(
					'error' => 'Ошибка сохранения данных. Обратитесь к администратору.',
				));

				return $response;
			}

			$response->setData(array(
				'error' => false,
			));

			return $response;
		}

		return $this->redirect('/');
	}

}