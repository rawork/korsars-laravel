<?php

namespace Fuga\PublicBundle\Controller\Game;

use Fuga\CommonBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;

class BattleController extends Controller
{
	public function data()
	{

	}

	public function question()
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
			$questionId = $this->get('request')->request->get('question');
			$question = $this->get('container')->getItem('question_battle', $questionId);
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