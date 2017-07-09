<?php

namespace Fuga\PublicBundle\Controller\Game;

use Fuga\CommonBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;

class DuelController extends Controller
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

		if ('POST' == $_SERVER['REQUEST_METHOD']) {
			$duel = $this->get('request')->request->getInt('duel');
			$state = $this->get('request')->request->get('state');

			$this->get('container')->updateItem(
				'game_duel',
				array('state' => json_encode($state)),
				array('duel' => $duel)
			);

			$response->setData(array(
				'error' => false,
			));

			return $response;
		}

		$game = $this->get('container')->getItem('game_duel', 'publish=1 AND (user1_id='.$user['id'].' OR user2_id='.$user['id'].')');

		if(!$game) {
			$response->setData(array(
				'error' => 'У вас нет доступа к данной игре. Обратитесь к администратору',
			));

			return $response;
		}

		$game['start'] = strtotime($game['start']);
		$game['current'] = time();
		$game['state'] = json_decode($game['state'], true);
		$game['user'] = $user['id'];

		$response->setData(array(
			'game' => $game,
		));

		return $response;
	}

	public function question()
	{
		$response = new JsonResponse();

		if (!$this->isXmlHttpRequest()) {
			return $this->redirect('/');
		}

		$user = $this->getManager('Fuga:Common:User')->getCurrentUser();
		if (!$user || $user['group_id'] == FAN_GROUP) {
			$response->setData(array(
				'error' => 'Access denied',
			));

			return $response;
		}

		if ('POST' == $_SERVER['REQUEST_METHOD']) {
			$questionId = $this->get('request')->request->get('step');
			$question = $this->get('container')->getItem('question_duel', $questionId);
			if ($question) {
				$response->setData(array(
					'error' => false,
					'question' => $question,
				));

				return $response;
			}

			$response->setData(array(
				'error' => 'Вопрос не найден. Обратитесь к администратору.',
			));

			return $response;
		}
	}
}