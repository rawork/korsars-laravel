<?php

namespace Fuga\PublicBundle\Controller\Admin;


use Fuga\AdminBundle\Controller\AdminController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class GameController extends AdminController
{
	public function index($state, $module)
	{
		$roles = $this->get('container')->getItems('pirate_prof', '1=1');
		$teams = $this->get('container')->getItems('crew_ship', 'is_over=0');

		return new Response($this->render('game/admin/index', compact('roles', 'teams', 'state', 'module')));
	}

	public function simple()
	{
		// TASK: В испытании участвуют капитаны, помощники и юнги от каждой команды (45 человек)
		// PEXESO: В испытании участвуют плотники, канониры, судовые врачи, коки (60 человек)
		// MAP: В испытании участвуют квартирмейстеры,  штурманы, боцманы, мастера парусов (60 человек)
		$response = new JsonResponse();

		if ('POST' == $_SERVER['REQUEST_METHOD'] && $this->isXmlHttpRequest()) {

			$type = $this->get('request')->request->get('type');
			$date = $this->get('request')->request->get('date');
			$time = $this->get('request')->request->get('time');

			$duration = $this->getManager('Fuga:Common:Param')->findByName('game', $type.'_duration');

			switch ($type) {
				case 'task':
					$roles = implode(',', array(CAPTAIN_ROLE, HELPER_ROLE, SHIPBOY_ROLE));
					break;
				case 'pexeso':
					$roles = implode(',', array(CARPENTER_ROLE, GUNNER_ROLE, DOCTOR_ROLE, COOK_ROLE));
					break;
				case 'map':
					$roles = implode(',', array(QUARTERMASTER_ROLE, NAVIGATOR_ROLE, BOATSWAIN_ROLE, SAILMASTER_ROLE));
					break;
			}

			$users = $this->get('container')->getItems('user_user', 'role_id IN('.$roles.')');

			foreach ($users as $user) {
				$game = $this->get('container')->getItem('game_' . $type, 'user_id=' . $user['id']);
				if ($game) {
					continue;
				}

				switch ($type) {
					case 'task':
						$this->get('container')->addItem(
							'game_' . $type,
							array(
								'user_id' => $user['id'],
								'start' => $date . ' ' . $time . ':00',
								'duration' => $duration,
								'is_answer' => 0,
								'publish' => 1,
							)
						);
						break;
					case 'pexeso':
						$this->get('container')->addItem(
							'game_' . $type,
							array(
								'user_id' => $user['id'],
								'start' => $date . ' ' . $time . ':00',
								'duration' => $duration,
								'money' => 0,
								'step' => 1,
								'publish' => 1,
							)
						);
						break;
					case 'map':
						$this->get('container')->addItem(
							'game_' . $type,
							array(
								'user_id' => $user['id'],
								'start' => $date . ' ' . $time . ':00',
								'duration' => 2, // 2 days
								'ratio' => 0,
								'cell' => '',
								'is_ready' => 0,
								'is_hunter' => $user['role_id'] == NAVIGATOR_ROLE ? 1 : 0,
								'publish' => 1,
							)
						);
						break;
				}

			}


			$response->setData(array(
					'error' => false,
					'message' => 'Игры назначены для игроков!',
				)
			);

			return $response;
		}

		$response->setData([
			'error' => true,
			'message' => 'Неправильная отправка данных',
		]);

		return $response;
	}

	public function labirint()
	{
		// В испытании участвуют матросы и пороховые обезьяны (60 человек).

		$duration = $this->getManager('Fuga:Common:Param')->findByName('game', 'labirint_duration');

		$response = new JsonResponse();

		if ('POST' == $_SERVER['REQUEST_METHOD'] && $this->isXmlHttpRequest()) {

			$this->get('log')->addError(json_encode($_POST));

			$date = $this->get('request')->request->get('date');
			$time = $this->get('request')->request->get('time');

			$roles = implode(',', array(MONKEY_ROLE, MARINE_ROLE));

			$users = $this->get('container')->getItems('user_user', 'role_id IN(' . $roles . ')');
			$ships = $this->get('container')->getItems('crew_ship');

			foreach ($ships as $ship) {
				$game = $this->get('container')->getItem('game_labirint', 'ship_id=' . $ship['id']);
				if ($game) {
					continue;
				}

				$markers = array();

				$i = 1;
				foreach ($users as $user) {
					if ($user['ship_id'] == $ship['id']) {
						$markers['marker'.$i] = $user['id'];
						$i++;
					}
				}

				$lives = array('marker1' => 3, 'marker2' => 3, 'marker3' => 3, 'marker4' => 3);
				$positions = array('marker1' => 0, 'marker2' => 0, 'marker3' => 0, 'marker4' => 0);
				$wait = array('marker1' => 0, 'marker2' => 0, 'marker3' => 0, 'marker4' => 0);
				$money = array('marker1' => 0, 'marker2' => 0, 'marker3' => 0, 'marker4' => 0);
				$chest = array('marker1' => 0, 'marker2' => 0, 'marker3' => 0, 'marker4' => 0);
				$rom = array('marker1' => 0, 'marker2' => 0, 'marker3' => 0, 'marker4' => 0);
				$coffee = array('marker1' => 0, 'marker2' => 0, 'marker3' => 0, 'marker4' => 0);
				$colors = array(
					'marker1' => 'Коричневый',
					'marker2' => 'Синий',
					'marker3' => 'Зеленый',
					'marker4' => 'Красный');


				$state = array(
					'markers' => $markers,
					'who_run' => 'marker1',
					'lives' => $lives,
					'positions' => $positions,
					'colors' => $colors,
					'wait' => $wait,
					'money' => $money,
					'chest' => $chest,
					'rom' => $rom,
					'coffee' => $coffee,
				);


				$this->get('container')->addItem(
					'game_labirint',
					array(
						'ship_id' => $ship['id'],
						'start' => $date . ' ' . $time . ':00',
						'duration' => $duration,
						'state' => json_encode($state),
						'publish' => 1,
					)
				);
			}

			$response->setData(array(
					'error' => false,
					'message' => 'Игры назначены для игроков!',
				)
			);

			return $response;
		}

		$response->setData([
			'error' => true,
			'message' => 'Неправильная отправка данных',
		]);

		return $response;
	}

	public function battle()
	{
		// Играют 12 команд, 4 стола по 3 в 2 дня. 1 из 3 команд - победитель.
		$duration = $this->getManager('Fuga:Common:Param')->findByName('game', 'battle_duration');

		$response = new JsonResponse();

		if ('POST' == $_SERVER['REQUEST_METHOD'] && $this->isXmlHttpRequest()) {

			$this->get('log')->addError(json_encode($_POST));

			$date1 = $this->get('request')->request->get('date1');
			$time1 = $this->get('request')->request->get('time1');

			$date2 = $this->get('request')->request->get('date2');
			$time2 = $this->get('request')->request->get('time2');

			$users = $this->get('container')->getItems('user_user', 'is_over<>1 AND role_id=' . HELPER_ROLE);
			$ships = $this->get('container')->getItems('crew_ship');

			$battles = array(1,2,3,4);

			foreach ($battles as $battle) {
				foreach ($ships as $ship) {
					$game = $this->get('container')->getItem('game_labirint', 'ship_id=' . $ship['id']);
					if ($game) {
						continue;
					}

					$markers = array();

					$i = 1;
					foreach ($users as $user) {
						if ($user['ship_id'] == $ship['id']) {
							$markers['marker'.$i] = $user['id'];
							$i++;
						}
					}

					$lives = array('marker1' => 3, 'marker2' => 3, 'marker3' => 3, 'marker4' => 3);
					$positions = array('marker1' => 0, 'marker2' => 0, 'marker3' => 0, 'marker4' => 0);
					$wait = array('marker1' => 0, 'marker2' => 0, 'marker3' => 0, 'marker4' => 0);
					$money = array('marker1' => 0, 'marker2' => 0, 'marker3' => 0, 'marker4' => 0);
					$chest = array('marker1' => 0, 'marker2' => 0, 'marker3' => 0, 'marker4' => 0);
					$rom = array('marker1' => 0, 'marker2' => 0, 'marker3' => 0, 'marker4' => 0);
					$coffee = array('marker1' => 0, 'marker2' => 0, 'marker3' => 0, 'marker4' => 0);
					$colors = array(
						'marker1' => 'Коричневый',
						'marker2' => 'Синий',
						'marker3' => 'Зеленый',
						'marker4' => 'Красный');


					$state = array(
						'markers' => $markers,
						'who_run' => 'marker1',
						'lives' => $lives,
						'positions' => $positions,
						'colors' => $colors,
						'wait' => $wait,
						'money' => $money,
						'chest' => $chest,
						'rom' => $rom,
						'coffee' => $coffee,
					);


					$this->get('container')->addItem(
						'game_labirint',
						array(
							'ship_id' => $ship['id'],
							'start' => $date1 . ' ' . $time1 . ':00',
							'duration' => $duration,
							'state' => json_encode($state),
							'publish' => 1,
						)
					);
				}
			}


			$response->setData(array(
					'error' => false,
					'message' => 'Игры назначены для игроков!',
				)
			);

			return $response;
		}

		$response->setData([
			'error' => true,
			'message' => 'Неправильная отправка данных',
		]);

		return $response;
	}

}