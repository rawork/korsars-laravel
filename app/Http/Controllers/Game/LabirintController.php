<?php

namespace Fuga\PublicBundle\Controller\Game;

use Fuga\CommonBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;

class LabirintController extends Controller
{
	public function data()
	{
		if (!$this->isXmlHttpRequest()) {
			return $this->redirect('/');
		}

		$response = new JsonResponse();

		$user = $this->getManager('Fuga:Common:User')->getCurrentUser();
		if (!$user || $user['group_id'] == FAN_GROUP) {
			$response->setData(array(
				'error' => 'Access denied',
			));

			return $response;
		}

//		$testMode = $this->getManager('Fuga:Common:Param')->findByName('game', 'test_mode');
//		$duration = $this->getManager('Fuga:Common:Param')->findByName('game', 'labirint_duration');

		if ('POST' == $_SERVER['REQUEST_METHOD']) {
			$state = $this->get('request')->request->get('state');

			$this->log(serialize($state));
			$this->get('container')->updateItem(
				'game_labirint',
				array('state' => json_encode($state)),
				array('ship_id' => $user['ship_id'])
			);

			$response->setData(array(
				'error' => false,
				'message' => 'state updated',
			));

			return $response;
		}

		$game = $this->get('container')->getItem('game_labirint', 'publish=1 AND ship_id='.$user['ship_id']);

		if(!$game) {
			$response->setData(array(
				'error' => 'У вас нет доступа к данной игре. Обратитесь к администратору',
			));

			return $response;
		}

		$game['start'] = strtotime($game['start']);
		$this->log('start='.strtotime($game['start']));
		$game['current'] = time();
		$game['user'] = $user['id'];
		$game['ship'] = $user['ship_id'];
		$game['state'] = json_decode($game['state'], true);

		$response->setData(array(
			'game' => $game,
		));

		return $response;
	}
}