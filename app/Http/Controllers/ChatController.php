<?php

namespace Fuga\PublicBundle\Controller;

use Fuga\CommonBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;

class ChatController extends Controller
{
	public function index()
	{
		return $this->redirect('/');
	}

	public function common()
	{
		if ($this->isXmlHttpRequest()) {
			$response = new JsonResponse();
			$id = $this->get('request')->request->getInt('id');
			if ($id > 0) {
				$messages = $this->get('container')->getItems('chat_common', 'publish=1 AND id>'.$id);
			} else {
				$messages = $this->get('container')->getItems('chat_common', 'publish=1', 'id DESC', 20);
			}

			foreach ($messages as &$message) {
				if ($message['user_id_value']['item']['role_id']) {
					$message['role'] = $this->get('container')->getItem('pirate_prof', $message['user_id_value']['item']['role_id']);
				} else {
					$message['role'] = array('name' => '');
				}
				if ($message['user_id_value']['item']['ship_id']) {
					$message['ship'] = $this->get('container')->getItem('crew_ship', $message['user_id_value']['item']['ship_id']);
				} else {
					$message['ship'] = array('name' => '');
				}
			}
			unset($message);

			$messages = array_reverse($messages, true);

			$response->setData(array(
				'error' => false,
				'messages' => $messages,
			));

			return $response;
		}

		return $this->redirect('/');
	}

	public function commonhistory()
	{
		if ($this->isXmlHttpRequest()) {
			$response = new JsonResponse();
			$id = $this->get('request')->request->getInt('id');
			$messages = $this->get('container')->getItems('chat_common', 'publish=1 AND id<'.$id);

			foreach ($messages as &$message) {
				if ($message['user_id_value']['item']['role_id']) {
					$message['role'] = $this->get('container')->getItem('pirate_prof', $message['user_id_value']['item']['role_id']);
				} else {
					$message['role'] = array('name' => '');
				}
				if ($message['user_id_value']['item']['ship_id']) {
					$message['ship'] = $this->get('container')->getItem('crew_ship', $message['user_id_value']['item']['ship_id']);
				} else {
					$message['ship'] = array('name' => '');
				}
			}
			unset($message);

			$response->setData(array(
				'error' => false,
				'messages' => $messages,
			));

			return $response;
		}



		return $this->redirect('/');
	}

	public function commonmessage()
	{
		if ('POST' == $_SERVER['REQUEST_METHOD']) {
			$response = new JsonResponse();

			$message = strip_tags($this->get('request')->request->get('message'));
			$user = $this->getManager('Fuga:Common:User')->getCurrentUser();

			try {
				$this->get('container')->addItem(
					'chat_common',
					array(
						'message' => $message,
						'user_id' => $user['id'],
						'created' => date('Y-m-d H:i:s'),
						'publish' => 1,
					)
				);

				// todo send message to admin


			} catch (\Exception $e) {
				$this->err($e->getMessage());
				$response->setData(array(
					'error' => true,
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

	public function ship()
	{
		if ($this->isXmlHttpRequest()) {
			$user = $this->getManager('Fuga:Common:User')->getCurrentUser();
			$response = new JsonResponse();
			$id = $this->get('request')->request->getInt('id');
			if ($id > 0) {
				$messages = $this->get('container')->getItems('chat_ship', 'publish=1 AND id>'.$id.' AND ship_id='.$user['ship_id']);
			} else {
				$messages = $this->get('container')->getItems('chat_ship', 'publish=1 AND ship_id='.$user['ship_id'], 'id DESC', 20);
			}

			foreach ($messages as &$message) {
				if ($message['user_id_value']['item']['role_id']) {
					$message['role'] = $this->get('container')->getItem('pirate_prof', $message['user_id_value']['item']['role_id']);
				} else {
					$message['role'] = array('name' => '');
				}
				if ($message['user_id_value']['item']['ship_id']) {
					$message['ship'] = $this->get('container')->getItem('crew_ship', $message['user_id_value']['item']['ship_id']);
				} else {
					$message['ship'] = array('name' => '');
				}
			}
			unset($message);

			$messages = array_reverse($messages, true);

			$response->setData(array(
				'error' => false,
				'messages' => $messages,
			));

			return $response;
		}

		return $this->redirect('/');
	}

	public function shiphistory()
	{
		if ($this->isXmlHttpRequest()) {
			$user = $this->getManager('Fuga:Common:User')->getCurrentUser();
			$response = new JsonResponse();
			$id = $this->get('request')->request->getInt('id');

			$messages = $this->get('container')->getItems('chat_ship', 'publish=1 AND id<'.$id. ' AND ship_id='.$user['ship_id']);

			foreach ($messages as &$message) {
				if ($message['user_id_value']['item']['role_id']) {
					$message['role'] = $this->get('container')->getItem('pirate_prof', $message['user_id_value']['item']['role_id']);
				} else {
					$message['role'] = array('name' => '');
				}
				if ($message['user_id_value']['item']['ship_id']) {
					$message['ship'] = $this->get('container')->getItem('crew_ship', $message['user_id_value']['item']['ship_id']);
				} else {
					$message['ship'] = array('name' => '');
				}
			}
			unset($message);

			$response->setData(array(
				'error' => false,
				'messages' => $messages,
			));

			return $response;
		}



		return $this->redirect('/');
	}

	public function shipmessage()
	{
		if ('POST' == $_SERVER['REQUEST_METHOD']) {
			$response = new JsonResponse();

			$message = strip_tags($this->get('request')->request->get('message'));
			$user = $this->getManager('Fuga:Common:User')->getCurrentUser();

			try {
				$this->get('container')->addItem(
					'chat_ship',
					array(
						'message' => $message,
						'user_id' => $user['id'],
						'ship_id' => $user['ship_id'],
						'created' => date('Y-m-d H:i:s'),
						'publish' => 1,
					)
				);

				// todo send message to admin


			} catch (\Exception $e) {
				$this->err($e->getMessage());
				$response->setData(array(
					'error' => true,
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

}