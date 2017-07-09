<?php

namespace Fuga\PublicBundle\Controller;

use Fuga\CommonBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;

class ShipController extends Controller
{
	public function index()
	{
		$user = $this->getManager('Fuga:Common:User')->getCurrentUser();
		if (!$user || $user['group_id'] == FAN_GROUP || $user['ship_id'] == 0) {
			return $this->redirect('/');
		}

		if ($user['role_id'] == HELPER_ROLE && $user['ship']['flag'] == 0) {
			return $this->redirect('/');
		}

		$ship = $user['ship'];
		$captain = $this->get('container')->getItem('user_user', 'is_active=1 AND is_over=0 AND role_id=13 AND ship_id='.$user['ship_id']);
		$candidateQuantity = $this->get('container')->count('crew_candidate', 'ship_id='.$ship['id']);
		$allowChangeCaptain = $this->getManager('Fuga:Common:Param')->findByName('ship', 'allow_change_captain');
		$allowDivideMoney = $this->getManager('Fuga:Common:Param')->findByName('ship', 'allow_divide_money');

		$this->addCss('/bundles/public/css/app.chat.css');
		$this->addJs('/bundles/public/js/app.chat.js');

		return $this->render('ship/index', compact('ship', 'user', 'candidateQuantity', 'captain',  'allowChangeCaptain', 'allowDivideMoney'));
	}

	public function crew($id)
	{
		$user = $this->getManager('Fuga:Common:User')->getCurrentUser();
		if (!$user || $user['group_id'] == FAN_GROUP) {
			return $this->redirect('/');
		}
		$crew = $this->get('container')->getItems('user_user', 'is_active=1 AND is_over=0 AND ship_id='.$id);

		return $this->render('ship/crew', compact('crew'));
	}

	public function chat($id)
	{
		$user = $this->getManager('Fuga:Common:User')->getCurrentUser();
		if (!$user || $user['group_id'] == FAN_GROUP) {
			return $this->redirect('/');
		}
		$messages = $this->get('container')->getItems('ship_chat', 'publish=1 AND ship_id='.$user['ship_id'], null, 20);

		return $this->render('ship/chat', compact('messages'));
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

			if ($user['role_id'] != HELPER_ROLE) {
				$response->setData(array(
					'error' => 'Access denied',
				));

				return $response;
			}

			$data = array(
				'name' => $this->get('request')->request->get('name', $user['ship']['name']),
				'slogan' => $this->get('request')->request->get('slogan', $user['ship']['slogan']),
			);


			try {
				$this->get('connection')->update(
					'crew_ship',
					$data,
					array('id' => $user['ship_id'])
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

	public function hire()
	{
		$user = $this->getManager('Fuga:Common:User')->getCurrentUser();
		if ('POST' == $_SERVER['REQUEST_METHOD']) {
			$response = new JsonResponse();
			if ($user['role_id'] != HELPER_ROLE) {
				$response->setData(array(
					'error' => 'Access denied',
				));

				return $response;
			}

			$candidateId = $this->get('request')->request->getInt('id');
			$candidate = $this->get('container')->getItem('crew_candidate', $candidateId);
			if (!$candidate) {
				$response->setData(array(
					'error' => 'Выбранный кандидат не определен. Обратитесь к администратору.',
				));

				return $response;
			}

			$quantity = -1;

			try {
				$this->get('connection')->beginTransaction();
				$this->get('container')->updateItem(
					'user_user',
					array(
						'ship_id' => $user['ship_id'],
					),
					array('id' => $candidate['user_id'])
				);

				$quantity = intval($candidate['vacancy_id_value']['item']['quantity']) - 1;

				$this->get('container')->updateItem(
					'crew_vacancy',
					array(
						'quantity' => $quantity,
						'publish' => 0 == $quantity ? 0 : 1,
					),
					array('id' => $candidate['vacancy_id'])
				);

				if ($quantity == 0) {
					$otherCandidates = $this->get('container')->getItems('crew_candidate', 'id<>'.$candidate['id'].' AND vacancy_id='.$candidate['vacancy_id']);
					if ($otherCandidates) {
						foreach ($otherCandidates as $otherCandidate) {
							$this->get('container')->addItem(
								'cabin_messages',
								array(
									'user_id' => $otherCandidate['user_id'],
									'text' => 'Не унывайте! Вам отказано на корабле &laquo;'.$candidate['ship_id_value']['item']['name'].'&raquo;',
									'publish' => 1,
									'created' => date('Y-m-d H:i:s'),
								)
							);

							$text = 'Информационное сообщение сайта '.$_SERVER['SERVER_NAME']."\n";
							$text .= '------------------------------------------'."\n";
							$text .= 'Вам отказано на корабле &laquo;'.$candidate['ship_id_value']['item']['name']."&raquo;\n\n";
							$text .= '<a href="http://'.$_SERVER['SERVER_NAME'].'/ship">Посмотреть ваш корабль</a>'."\n\n";
							$text .= 'Сообщение сгенерировано автоматически.'."\n";
							$this->get('mailer')->send(
								'КОРСАРЫ АНКОРа - Вам отказано в найме',
								nl2br($text),
								$otherCandidate['user_id_value']['item']['email']
							);
						}
					}
					$this->get('container')->getTable('crew_candidate')->delete('vacancy_id='.$candidate['vacancy_id']);
				} else {
					$this->get('container')->getTable('crew_candidate')->delete('id='.$candidate['id']);
				}


				$this->get('container')->addItem(
					'cabin_messages',
					array(
						'user_id' => $candidate['user_id'],
						'text' => 'Поздравляем! Вы наняты на корабль &laquo;'.$candidate['ship_id_value']['item']['name'].'&raquo;',
						'publish' => 1,
						'created' => date('Y-m-d H:i:s'),
					)
				);

				$text = 'Информационное сообщение сайта '.$_SERVER['SERVER_NAME']."\n";
				$text .= '------------------------------------------'."\n";
				$text .= 'Вы наняты на корабль &laquo;'.$candidate['ship_id_value']['item']['name']."&raquo;\n\n";
				$text .= '<a href="http://'.$_SERVER['SERVER_NAME'].'/ship">Посмотреть ваш корабль</a>'."\n\n";
				$text .= 'Сообщение сгенерировано автоматически.'."\n";
				$this->get('mailer')->send(
					'КОРСАРЫ АНКОРа - Вы наняты на корабль',
					nl2br($text),
					$candidate['user_id_value']['item']['email']
				);


				$this->get('connection')->commit();
			} catch (\Exception $e) {
				$this->get('connection')->rollback();
				$this->err($e->getMessage());
				$response->setData(array(
					'error' => 'Ошибка сервера. Обратитесь к администратору.',
				));

				return $response;
			}

			$response->setData(array(
				'error' => false,
				'quantity' => $quantity,
				'candidate' => $candidate,
			));

			return $response;
		}

		if ($this->isXmlHttpRequest()) {
			$response = new JsonResponse();
			if ($user['role_id'] != HELPER_ROLE) {
				$response->setData(array(
					'error' => 'Access denied',
				));

				return $response;
			}

			$vacancies = $this->get('container')->getItems('crew_vacancy', 'publish=1 AND ship_id='.$user['ship_id']);
			foreach ($vacancies as &$vacancy){
				$vacancy['candidates'] = $this->get('container')->getItems('crew_candidate', 'vacancy_id='.$vacancy['id']);
				if (is_array($vacancy['candidates'])) {
					foreach ($vacancy['candidates'] as &$candidate) {
						$field = $this->get('container')->getTable('user_user')->getFieldType($this->get('container')->getTable('user_user')->fields['avatar']);
						$candidate['avatar_extra'] = $this->get('imagestorage')->additionalFiles($candidate['user_id_value']['item']['avatar'], ['sizes' => $field->getParam('sizes')]);
					}
					unset($candidate);
				}
			}
			unset($vacancy);

			$response->setData(array(
				'content' => $this->render('ship/hire', compact('vacancies')),
			));

			return $response;
		}

		return $this->redirect('/');
	}

	public function captain()
	{
		$user = $this->getManager('Fuga:Common:User')->getCurrentUser();
		if ('POST' == $_SERVER['REQUEST_METHOD']) {
			$response = new JsonResponse();
			if ($user['role_id'] != HELPER_ROLE) {
				$response->setData(array(
					'error' => 'Access denied',
				));

				return $response;
			}

			$captainId = $this->get('request')->request->getInt('id');
			$marineId = $this->get('request')->request->getInt('marine');

			$captain = $this->get('container')->getItem('user_user', $captainId);
			$marine = $this->get('container')->getItem('user_user', 'id='.$marineId.' AND role_id='.MARINE_ROLE);
			if (!$captain) {
				$response->setData(array(
					'error' => 'Выбранный пират не определен. Обратитесь к администратору.',
				));

				return $response;
			}

			try {
				$this->get('connection')->beginTransaction();
				$oldCaptain = $this->get('container')->getItem('user_user', 'is_active=1 AND is_over=0 AND role_id=13 AND ship_id='.$user['ship_id']);
				if ($oldCaptain) {
					$this->get('container')->updateItem(
						'user_user',
						array(
							'role_id' => MARINE_ROLE,
						),
						array('id' => $oldCaptain['id'])
					);
					$this->get('container')->addItem(
						'cabin_messages',
						array(
							'user_id' => $oldCaptain['id'],
							'text' => 'Вы больше не являетесь капитаном',
							'publish' => 1,
							'created' => date('Y-m-d H:i:s'),
						)
					);

					$text = 'Информационное сообщение сайта '.$_SERVER['SERVER_NAME']."\n";
					$text .= '------------------------------------------'."\n";
					$text .= 'Вы больше не являетесь капитаном'."\n\n";
					$text .= '<a href="http://'.$_SERVER['SERVER_NAME'].'/ship">Посмотреть ваш корабль</a>'."\n\n";
					$text .= 'Сообщение сгенерировано автоматически.'."\n";
					$this->get('mailer')->send(
						'КОРСАРЫ АНКОРа - Вы больше не являетесь капитаном',
						nl2br($text),
						$oldCaptain['email']
					);
				}
				$this->get('container')->updateItem(
					'user_user',
					array(
						'role_id' => CAPTAIN_ROLE,
					),
					array('id' => $captain['id'])
				);
				if ($marine) {
					$this->get('container')->updateItem(
						'user_user',
						array(
							'role_id' => $captain['role_id'],
						),
						array('id' => $marine['id'])
					);

					$this->get('container')->addItem(
						'cabin_messages',
						array(
							'user_id' => $marine['id'],
							'text' => 'Поздравляем! Вас повысили в должности, '.$captain['role_id_value']['item']['name'],
							'publish' => 1,
							'created' => date('Y-m-d H:i:s'),
						)
					);

					$text = 'Информационное сообщение сайта '.$_SERVER['SERVER_NAME']."\n";
					$text .= '------------------------------------------'."\n";
					$text .= 'Вас повысили в должности, '.$captain['role_id_value']['item']['name']."\n\n";
					$text .= '<a href="http://'.$_SERVER['SERVER_NAME'].'/ship">Посмотреть ваш корабль</a>'."\n\n";
					$text .= 'Сообщение сгенерировано автоматически.'."\n";
					$this->get('mailer')->send(
						'КОРСАРЫ АНКОРа - Вас повысили в должности',
						nl2br($text),
						$marine['email']
					);
				}

				$this->get('container')->addItem(
					'cabin_messages',
					array(
						'user_id' => $captain['id'],
						'text' => 'Поздравляем! Вы выбраны капитаном корабля &laquo;'.$captain['ship_id_value']['item']['name'].'&raquo;',
						'publish' => 1,
						'created' => date('Y-m-d H:i:s'),
					)
				);

				$text = 'Информационное сообщение сайта '.$_SERVER['SERVER_NAME']."\n";
				$text .= '------------------------------------------'."\n";
				$text .= 'Вы выбраны капитаном корабля &laquo;'.$captain['ship_id_value']['item']['name']."&raquo;\n\n";
				$text .= '<a href="http://'.$_SERVER['SERVER_NAME'].'/ship">Посмотреть ваш корабль</a>'."\n\n";
				$text .= 'Сообщение сгенерировано автоматически.'."\n";
				$this->get('mailer')->send(
					'КОРСАРЫ АНКОРа - Вы выбраны капитаном корабля',
					nl2br($text),
					$captain['email']
				);


				$this->get('connection')->commit();
			} catch (\Exception $e) {
				$this->get('connection')->rollback();
				$this->err($e->getMessage());
				$response->setData(array(
					'error' => 'Ошибка сервера. Обратитесь к администратору.',
				));

				return $response;
			}

			$response->setData(array(
				'error' => false,
				'content' => '<h2>Капитан успешно назначен</h2>',
				'captain' => $captain,
			));

			return $response;
		}

		if ($this->isXmlHttpRequest()) {
			$response = new JsonResponse();
			if ($user['role_id'] != HELPER_ROLE) {
				$response->setData(array(
					'error' => 'Access denied',
				));

				return $response;
			}

			$crew = $this->get('container')->getItems('user_user', 'is_active=1 AND is_over=0 AND role_id NOT IN(1,13) AND ship_id='.$user['ship_id']);
			if (is_array($crew)) {
				foreach ($crew as &$candidate) {
					$field = $this->get('container')->getTable('user_user')->getFieldType($this->get('container')->getTable('user_user')->fields['avatar']);
					$candidate['avatar_extra'] = $this->get('imagestorage')->additionalFiles($candidate['avatar'], ['sizes' => $field->getParam('sizes')]);
				}
				unset($candidate);
			}
			$marines = $this->get('container')->getItems('user_user', 'is_active=1 AND is_over=0 AND role_id=2 AND ship_id='.$user['ship_id']);
			if (is_array($marines)) {
				foreach ($marines as &$candidate) {
					$field = $this->get('container')->getTable('user_user')->getFieldType($this->get('container')->getTable('user_user')->fields['avatar']);
					$candidate['avatar_extra'] = $this->get('imagestorage')->additionalFiles($candidate['avatar'], ['sizes' => $field->getParam('sizes')]);
				}
				unset($candidate);
			}

			$response->setData(array(
				'error' => false,
				'content' => $this->render('ship/captain', compact('crew', 'marines')),
			));

			return $response;
		}

		return $this->redirect('/');
	}

	public function money()
	{
		$user = $this->getManager('Fuga:Common:User')->getCurrentUser();
		if ('POST' == $_SERVER['REQUEST_METHOD']) {
			$response = new JsonResponse();
			if ($user['role_id'] != CAPTAIN_ROLE) {
				$response->setData(array(
					'error' => 'Access denied',
				));

				return $response;
			}

			$purse = $user['ship']['purse'];

			$money = 0;
			$crew = $this->get('container')->getItems('user_user', 'is_active=1 AND is_over=0 AND ship_id='.$user['ship_id']);

			foreach ($crew as $member) {
				$memberMoney = $this->get('request')->request->getInt('purse_'.$member['id']);
				$money += $memberMoney;
			}

			if ($money < $purse) {
				$response->setData(array(
					'error' => 'Распределены не все деньги. Осталось '.($purse-$money).' пиастров',
				));

				return $response;
			}

			if ($money > $purse) {
				$response->setData(array(
					'error' => 'Распределено денег больше, чем есть на корабле',
				));

				return $response;
			}


			try {
				$this->get('connection')->beginTransaction();
				foreach ($crew as $member) {
					$memberMoney = $this->get('request')->request->getInt('purse_'.$member['id']);
					$this->get('container')->updateItem(
						'user_user',
						array(
							'purse' => intval($user['purse']) + $memberMoney,
						),
						array('id' => $member['id'])
					);
					if ($memberMoney <= 0) {
						continue;
					}
					$this->get('container')->addItem(
						'cabin_messages',
						array(
							'user_id' => $member['id'],
							'text' => 'Вам начислили жалование по заслугам в боях и сражениях. '.$memberMoney.' пиастров',
							'publish' => 1,
							'created' => date('Y-m-d H:i:s'),
						)
					);

					$text = 'Информационное сообщение сайта '.$_SERVER['SERVER_NAME']."\n";
					$text .= '------------------------------------------'."\n";
					$text .= 'Вам начислили жалование по заслугам в боях и сражениях. '.$memberMoney.' пиастров'."\n\n";
					$text .= '<a href="http://'.$_SERVER['SERVER_NAME'].'/cabin">Посмотреть ваш профиль</a>'."\n\n";
					$text .= 'Сообщение сгенерировано автоматически.'."\n";
					$this->get('mailer')->send(
						'КОРСАРЫ АНКОРа - Вам начислили жалование',
						nl2br($text),
						$member['email']
					);
				}


				$this->get('container')->updateItem(
					'crew_ship',
					array(
						'purse' => 0,
					),
					array('id' => $user['ship_id'])
				);

				$this->get('connection')->commit();
			} catch (\Exception $e) {
				$this->get('connection')->rollback();
				$this->err($e->getMessage());
				$response->setData(array(
					'error' => 'Ошибка сервера. Обратитесь к администратору.',
				));

				return $response;
			}

			$response->setData(array(
				'error' => false,
				'content' => '<h2>Добыча успешно распределена между членами команды</h2>',
			));

			return $response;
		}

		if ($this->isXmlHttpRequest()) {
			$response = new JsonResponse();
			if ($user['role_id'] != CAPTAIN_ROLE) {
				$response->setData(array(
					'error' => 'Access denied',
				));

				return $response;
			}

			$crew = $this->get('container')->getItems('user_user', 'is_active=1 AND is_over=0 AND ship_id='.$user['ship_id']);
			$ship = $user['ship'];
			if (is_array($crew)) {
				foreach ($crew as &$candidate) {
					$field = $this->get('container')->getTable('user_user')->getFieldType($this->get('container')->getTable('user_user')->fields['avatar']);
					$candidate['avatar_extra'] = $this->get('imagestorage')->additionalFiles($candidate['avatar'], ['sizes' => $field->getParam('sizes')]);
				}
				unset($candidate);
			}

			$response->setData(array(
				'error' => false,
				'content' => $this->render('ship/money', compact('crew', 'ship')),
			));

			return $response;
		}

		return $this->redirect('/');
	}

}