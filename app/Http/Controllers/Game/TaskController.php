<?php

namespace Fuga\PublicBundle\Controller\Game;

use Fuga\CommonBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;

class TaskController extends Controller
{
	public function data()
	{
		$response = new JsonResponse();

		$user = $this->getManager('Fuga:Common:User')->getCurrentUser();
		if (!$user || $user['group_id'] == FAN_GROUP) {
			$response->setData(array(
				'error' => 'Access denied',
			));

			return $response;
		}

		if ('POST' == $_SERVER['REQUEST_METHOD']) {
			$answer = $this->get('request')->request->getInt('answer');
			$this->get('container')->updateItem(
				'game_task',
				array('result' => $answer, 'is_answer' => 1),
				array('user_id' => $user['id'])
			);
			$response->setData(array(
				'error' => false,
			));

			return $response;
		}

		$testMode = $this->getManager('Fuga:Common:Param')->findByName('game', 'test_mode');
		$start = $this->getManager('Fuga:Common:Param')->findByName('game', 'task_start');
		$duration = $this->getManager('Fuga:Common:Param')->findByName('game', 'task_duration');

		$game = $this->get('container')->getItem('game_task', 'publish=1 AND user_id='.$user['id']);
		if ($testMode) {

			// В тестовом режиме игра начинается с текущего момента
			$start = date('Y-m-d H:i:s');

			// В тестовом режиме всегда начинаем с начала при перезагрузке страницы
			if (!$game) {
				$this->get('container')->addItem(
					'game_task',
					[
						'user_id' => $user['id'],
						'start' => $start,
						'duration' => $duration,
						'created' => date('Y-m-d H:i:s'),
						'publish' => 1,
					]
				);
			} else {
				$this->get('container')->updateItem(
					'game_task',
					[
						'start' => $start,
						'duration' => $duration,
						'updated' => date('Y-m-d H:i:s'),
						'result' => 0,
						'is_answer' => 0,
						'publish' => 1,
					],
					['id' => $game['id']]
				);

				$game = $this->get('container')->getItem('game_task', 'publish=1 AND user_id='.$user['id']);
			}

		} elseif (!$game) {
			/*
			 *  При отсутствии игры для текущего игрока создаем ее в тестовом режиме для всех,
			 *  в боевом режиме для Капитанов, Помощников и юнг
			 */
			if  ($user['group_id'] == 1 || in_array($user['role_id'], [CAPTAIN_ROLE, SHIPBOY_ROLE, HELPER_ROLE])){
				$this->get('container')->addItem(
					'game_task',
					[
						'user_id' => $user['id'],
						'start' => $start,
						'duration' => $duration,
						'created' => date('Y-m-d H:i:s'),
						'publish' => 1,
					]
				);

				$game = $this->get('container')->getItem('game_task', 'publish=1 AND user_id='.$user['id']);
			}
		}

		if(!$game) {
			$response->setData(array(
				'error' => 'У вас нет доступа к данной игре. Обратитесь к администратору',
			));

			return $response;
		}

		$game['start'] = strtotime($game['start']);
		$game['current'] = time();

		$response->setData(array(
			'game' => $game,
		));

		return $response;
	}
}