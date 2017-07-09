<?php

namespace Fuga\PublicBundle\Controller\Game;

use Fuga\CommonBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;

class MapController extends Controller
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
			$answers = array(
				"cell179" => 1,
				"cell41" => 0.5,
				"cell73" => 0.5,
				"cell150"=> 0.5,
				"cell209"=> 0.5
			);

			$cell = $this->get('request')->request->get('cell');
			$isReady = $this->get('request')->request->getInt('is_ready');
			if ($cell) {
				$this->get('container')->updateItem(
					'game_map',
					array('cell' => $cell, 'ratio' => isset($answers[$cell]) ? $answers[$cell] : 0),
					array('user_id' => $user['id'])
				);
			}
			if ($isReady) {
				$this->get('container')->updateItem(
					'game_map',
					array('is_ready' => $isReady),
					array('user_id' => $user['id'])
				);
			}

			$response->setData(array(
				'error' => false,
			));

			return $response;
		}

		$testMode = $this->getManager('Fuga:Common:Param')->findByName('game', 'test_mode');
		$start = $this->getManager('Fuga:Common:Param')->findByName('game', 'map_start');
		$duration = $this->getManager('Fuga:Common:Param')->findByName('game', 'map_duration');

		$game = $this->get('container')->getItem('game_map', 'publish=1 AND user_id='.$user['id']);
		if ($testMode) {

			// В тестовом режиме игра начинается с текущего момента
			$start = date('Y-m-d H:i:s');

			// В тестовом режиме всегда начинаем с начала при перезагрузке страницы
			if (!$game) {
				$this->get('container')->addItem(
					'game_map',
					[
						'user_id' => $user['id'],
						'start' => $start,
						'duration' => $duration,
						'created' => date('Y-m-d H:i:s'),
						'is_hunter' => 1,
						'publish' => 1,
					]
				);
			} else {
				$this->get('container')->updateItem(
					'game_map',
					[
						'start' => $start,
						'duration' => $duration,
						'updated' => date('Y-m-d H:i:s'),
						'ratio' => 0,
						'cell' => '',
						'is_ready' => 0,
						'is_hunter' => 1,
						'publish' => 1,
					],
					['id' => $game['id']]
				);

				$game = $this->get('container')->getItem('game_map', 'publish=1 AND user_id='.$user['id']);
			}

		} elseif (!$game) {
			/*
			 *  При отсутствии игры для текущего игрока создаем ее в тестовом режиме для всех,
			 *  в боевом режиме для Капитанов, Помощников и юнг
			 */
			if  ($user['group_id'] == 1 || in_array($user['role_id'], [QUARTERMASTER_ROLE, NAVIGATOR_ROLE, BOATSWAIN_ROLE, SAILMASTER_ROLE])){
				$this->get('container')->addItem(
					'game_map',
					[
						'user_id' => $user['id'],
						'start' => $start,
						'duration' => $duration,
						'created' => date('Y-m-d H:i:s'),
						'is_hunter' => $user['role_id'] == NAVIGATOR_ROLE ? 1 : 0,
						'publish' => 1,
					]
				);

				$game = $this->get('container')->getItem('game_map', 'publish=1 AND user_id='.$user['id']);
			}
		}

		if (!$game) {
			$response->setData(array(
				'error' => 'У вас нет доступа к данной игре. Обратитесь к администратору',
			));

			return $response;
		}

		$dt = new \DateTime($game['start']);
		$game['start'] = $dt->getTimestamp();
		$game['current'] = time();

		$response->setData(array(
			'error' => false,
			'game' => $game,
		));

		return $response;
	}
}