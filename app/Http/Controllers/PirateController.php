<?php

namespace Fuga\PublicBundle\Controller;

use Fuga\CommonBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;

class PirateController extends Controller
{
	public function index()
	{
		$user = $this->getManager('Fuga:Common:User')->getCurrentUser();

		$pirates = $this->getManager('Fuga:Common:User')->getPirates();
		if ($user && $user['group_id'] == FAN_GROUP) {
			$likes = $this->get('container')->getItems('pirate_likes', 'user_id='.$user['id']);
			foreach ($pirates as &$pirate) {
				foreach ($likes as $like) {
					if ($like['pirate_id'] == $pirate['id']) {
						$pirate['liked'] = true;
					}
				}
			}
			unset($pirate);
		} else {
			$user['no_like'] = true;
		}

		return $this->render('pirate/index', compact('pirates', 'user'));
	}

	public function like()
	{
		$response = new JsonResponse();

		$pirate_id = $this->get('request')->request->get('id');
		$pirate = $this->get('container')->getItem('user_user', $pirate_id);
		$user = $this->getManager('Fuga:Common:User')->getCurrentUser();

		$result = '';

		if (!$user || !$pirate || $user['group_id'] != FAN_GROUP) {
			$response->setData(array(
				'error' => true,
			));

			return $response;
		}

		$like = $this->get('container')->getItem('pirate_likes', 'user_id='.$user['id'].' AND pirate_id='.$pirate_id);

		try {
			$this->get('connection')->beginTransaction();
			if ($like) {
				$this->get('container')->deleteItem('pirate_likes', 'id='.$like['id']);
				$this->get('container')->updateItem(
					'user_user',
					array('likes' => --$pirate['likes']),
					array('id' => $pirate['id'])
				);
				$result = 'deleted';
			} else {
				$this->get('container')->addItem(
					'pirate_likes',
					array(
						'user_id' => $user['id'],
						'pirate_id' => $pirate['id']
					));
				$this->get('container')->updateItem(
					'user_user',
					array('likes' => ++$pirate['likes']),
					array('id' => $pirate['id'])
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

} 