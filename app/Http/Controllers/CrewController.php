<?php

namespace Fuga\PublicBundle\Controller;

use Fuga\CommonBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;

class CrewController extends Controller
{
	public function index()
	{
		$user = $this->getManager('Fuga:Common:User')->getCurrentUser();

		$ships = $this->get('container')->getItems('crew_ship');
		if ($user && $user['group_id'] == FAN_GROUP) {
			$likes = $this->get('container')->getItems('crew_likes', 'user_id='.$user['id']);
			foreach ($ships as &$ship) {
				foreach ($likes as $like) {
					if ($like['ship_id'] == $ship['id']) {
						$ship['liked'] = true;
					}
				}
			}
			unset($ship);
		} else {
			$user['no_like'] = true;
		}

		return $this->render('crew/index', compact('ships', 'user'));
	}

	public function ship($id)
	{
		$ship = $this->get('container')->getItem('crew_ship', $id);

		return $this->render('crew/ship', compact('ship'));
	}

	public function vacancy($id)
	{
		$user = $this->getManager('Fuga:Common:User')->getCurrentUser();
		if (!$user || $user['group_id'] == FAN_GROUP) {
			return $this->redirect('/');
		}

		$user['is_busy'] = $this->get('container')->count('crew_candidate', 'user_id='.$user['id']);
		$vacancies = $this->get('container')->getItems('crew_vacancy', 'publish=1 AND ship_id='.$id);
		foreach ($vacancies as &$vacancy) {
			$vacancy['candidates'] = $this->get('container')->count('crew_candidate', 'ship_id='.$id);
		}
		unset($vacancy);

		return $this->render('ship/vacancy', compact('vacancies', 'user'));
	}

	public function like()
	{
		$response = new JsonResponse();

		$ship_id = $this->get('request')->request->get('id');
		$ship = $this->get('container')->getItem('crew_ship', $ship_id);
		$user = $this->getManager('Fuga:Common:User')->getCurrentUser();

		$result = '';

		if (!$user || !$ship || $user['group_id'] != FAN_GROUP) {
			$response->setData(array(
				'error' => true,
			));

			return $response;
		}

		$like = $this->get('container')->getItem('crew_likes', 'user_id='.$user['id'].' AND ship_id='.$ship_id);

		try {
			$this->get('connection')->beginTrans();
			if ($like) {
				$this->get('container')->deleteItem('crew_likes', 'id='.$like['id']);
				$this->get('container')->updateItem(
					'crew_ship',
					array('likes' => --$ship['likes']),
					array('id' => $ship['id'])
				);
				$result = 'deleted';
			} else {
				$this->get('container')->addItem(
					'crew_likes',
					array(
						'user_id' => $user['id'],
						'ship_id' => $ship['id']
					));
				$this->get('container')->updateItem(
					'crew_ship',
					array('likes' => ++$ship['likes']),
					array('id' => $ship['id'])
				);
				$result = 'added';
			}
			$this->get('connection')->commit();
		} catch (\Exception $e){
			$this->err($e->getMessage());
			$this->get('connection')->rollback();
		}

		$response->setData(array(
			'error' => false,
			'result' => $result,
		));

		return $response;
	}

	public function reply()
	{
		if ('POST' == $_SERVER['REQUEST_METHOD']) {
			$response = new JsonResponse();
			$user = $this->getManager('Fuga:Common:User')->getCurrentUser();
			if (!$user || $user['group_id'] == FAN_GROUP) {
				$response->setData(array(
					'error' => 'Access denied',
				));

				return $response;
			}

			$shipId = $this->get('request')->request->getInt('ship');
			$vacancyId = $this->get('request')->request->getInt('vacancy');
			$ship = $this->get('container')->getItem('crew_ship', $shipId);
			$vacancy = $this->get('container')->getItem('crew_vacancy', 'id='.$vacancyId.' AND publish=1 AND quantity>0');

			if (!$ship) {
				$this->err('Vacancy ship error for ID:'.$shipId);
				$response->setData(array(
					'error' => 'Не найден корабль вакансии',
				));

				return $response;
			}

			if (!$vacancy) {
				$this->err('Vacancy error for ID:'.$vacancyId);
				$response->setData(array(
					'error' => 'Вакансия закрыта',
				));

				return $response;
			}

			$candidatesQ = $this->get('container')->count('crew_candidate', 'vacancy_id='.$vacancyId);
			if ($candidatesQ > 2) {
				$response->setData(array(
					'error' => false,
					'content' => '<h2>Для данной вакансии на этом корабле достаточно кандидатов. Попытайте счастье на другом.</h2>',
				));

				return $response;
			}

			$userCandidate = $this->get('container')->getItem('crew_candidate', 'user_id='.$user['id']);
			if ($userCandidate) {
				$response->setData(array(
					'error' => false,
					'content' => '<h2>Вы уже являетесь кандидатом. Ожидайте результата выбора.</h2>',
				));

				return $response;
			}

			$this->get('container')->addItem(
				'crew_candidate',
				array(
					'ship_id' => $ship['id'],
					'vacancy_id' => $vacancy['id'],
					'user_id' => $user['id'],
				)
			);

			// todo send email to first helper
			$helper = $this->get('container')->getItem('user_user', 'role_id=1 AND ship_id='.$ship['id']);
			if ($helper) {
				$text = 'Информационное сообщение сайта '.$_SERVER['SERVER_NAME']."\n";
				$text .= '------------------------------------------'."\n";
				$text .= 'Появился новый кандидат на должность: '.$vacancy['role_id_value']['item']['name']."\n\n";
				$text .= '<a href="http://'.$_SERVER['SERVER_NAME'].'/ship">Посмотреть кандидатов</a>'."\n\n";
				$text .= 'Сообщение сгенерировано автоматически.'."\n";
				$this->get('mailer')->send(
					'КОРСАРЫ АНКОРа - новый кандидат на должность',
					nl2br($text),
					$helper['email']
				);
				$this->get('container')->addItem(
					'cabin_messages',
					array(
						'user_id' => $helper['id'],
						'text' => 'Появился новый кандидат на должность: '.$vacancy['role_id_value']['item']['name'],
						'publish' => 1,
						'created' => date('Y-m-d H:i:s'),
					)
				);
			}

			$response = new JsonResponse();
			$response->setData(array(
				'error' => false,
				'content' => '<h2>Старший помощник в курсе вашей кандидатуры. Вы будете уведомлены, когда вашу кандидатуру рассмотрят.</h2>'
			));

			return $response;
		}

		return $this->redirect('/');
	}

} 