<?php

namespace Fuga\PublicBundle\Controller\Game;

use Fuga\CommonBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;

class MarketController extends Controller
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
			$money = $this->get('request')->request->getInt('money');
			$this->get('container')->updateItem(
				'game_market',
				array('money' => $money),
				array('user_id' => $user['id'])
			);
			$response->setData(array(
				'error' => false,
			));
			return $response;
		}

		$testMode = $this->getManager('Fuga:Common:Param')->findByName('game', 'test_mode');
		$duration = $this->getManager('Fuga:Common:Param')->findByName('game', 'market_duration');
		$dates = array(
			$this->getManager('Fuga:Common:Param')->findByName('game', 'market_date1'),
			$this->getManager('Fuga:Common:Param')->findByName('game', 'market_date2'),
			$this->getManager('Fuga:Common:Param')->findByName('game', 'market_date3'),
			$this->getManager('Fuga:Common:Param')->findByName('game', 'market_date4')
		);
		$tables = array('question_quiz_coffee', 'question_quiz_fabric', 'question_quiz_spice', 'question_quiz_stone');

		$game = $this->get('container')->getItem('game_market', 'publish=1 AND user_id='.$user['id']);
		if ($testMode) {

			// В тестовом режиме игра начинается с текущего момента
			$start = date('Y-m-d H:i:s');

			// В тестовом режиме всегда начинаем с начала при перезагрузке страницы
			if (!$game) {
				$this->get('container')->addItem(
					'game_market',
					[
						'user_id' => $user['id'],
						'start' => $start,
						'duration' => $duration,
						'created' => date('Y-m-d H:i:s'),
						'money' => 0,
						'question' => $tables[rand(0,3)],
						'publish' => 1,
					]
				);
			} else {
				$this->get('container')->updateItem(
					'game_market',
					[
						'start' => $start,
						'duration' => $duration,
						'updated' => date('Y-m-d H:i:s'),
						'money' => 0,
						'question' => $tables[rand(0,3)],
						'publish' => 1,
					],
					['id' => $game['id']]
				);

				$game = $this->get('container')->getItem('game_market', 'publish=1 AND user_id='.$user['id']);
			}

		} elseif (!$game) {
			/*
			 *  При отсутствии игры для текущего игрока создаем ее
			 */

			$ships = $this->get('container')->getItems('crew_ship');
			$groups = array();
			$i = 0;
			$j = 0;
			foreach ($ships as $ship) {
				$groups[$ship['id']] = $i;
				$j++;

				if (2 < $j) {
					$j = 0;
					$i++;
				}

			}

			if  ($user['group_id'] == 1 || $user['group_id'] == GAMER_GROUP){
				$this->get('container')->addItem(
					'game_market',
					[
						'user_id' => $user['id'],
						'start' => $dates[$groups[$user['ship_id']]], // todo by ship
						'duration' => $duration,
						'created' => date('Y-m-d H:i:s'),
						'question' => $tables[$groups[$user['ship_id']]], // todo by ship
						'publish' => 1,
					]
				);

				$game = $this->get('container')->getItem('game_market', 'publish=1 AND user_id='.$user['id']);
			}
		}

		if (!$game) {
			$response->setData(array(
				'error' => 'Игра не настроена для вашего профиля. Обратитесь к администратору',
			));

			return $response;
		}

		$game['start'] = strtotime($game['start']);
		$game['current'] = time();
		$game['testmode'] = $testMode;

		$response->setData(array(
			'game' => $game,
		));

		return $response;
	}

	public function question()
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
			$questionId = $this->get('request')->request->get('question');
			$table = $this->get('request')->request->get('table');
			$question = $this->get('container')->getItem($table, $questionId);
			if ($question) {
				$response->setData(array(
					'error' => false,
					'question' => $question,
				));

				return $response;
			} else {
				$response->setData(array(
					'error' => 'Вопрос не найден. Обратитесь к администратору.',
				));

				return $response;
			}
		}

	}
}