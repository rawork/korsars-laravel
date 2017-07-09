<?php

namespace Fuga\PublicBundle\Controller\Admin;


use Fuga\AdminBundle\Controller\AdminController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class CrewController extends AdminController
{
	protected $maxCrew = 25;

	public function index($state, $module)
	{
		return new Response($this->render('crew/admin/index', compact('state', 'module')));
	}

	public function vacancy()
	{
		$response = new JsonResponse();
		if ('POST' == $_SERVER['REQUEST_METHOD'] && $this->isXmlHttpRequest()) {

			$ships = $this->get('container')->getItems('crew_ship', 'publish=1 AND is_over=1');

			foreach ($ships as $ship){
				$crew = $this->get('container')->getItems('user_user', 'is_over=0 AND ship_id='.$ship['id']);
				foreach ($crew as $pirate){
					$this->get('container')->updateItem(
						'user_user',
						['ship_id' => 0, 'role_id' => MARINE_ROLE],
						['id' => $pirate['id']]
					);
				}
			}

			$ships = $this->get('container')->getItems('crew_ship', 'publish=1 AND is_over=0');

			foreach ($ships as $ship){
				$crew = $this->get('container')->count('user_user', 'is_over=0 AND ship_id='.$ship['id']);

				$needMarine = $this->maxCrew - $crew;

				if ($needMarine > 0) {
					$vacancy = $this->get('container')->count(
						'crew_vacancy',
						'publish=1 AND role_id='.MARINE_ROLE.' AND ship_id='.$ship['id']
					);

					if ($vacancy == 0) {
						$this->get('container')->addItem(
							'crew_vacancy',
							[
								'ship_id' => $ship['id'],
								'role_id' => MARINE_ROLE,
								'quantity' => $needMarine,
								'publish' => 1,
								'created' => date('Y-m-d H:i:s'),
							]
						);
					}
				}
			}

			$response->setData([
				'error' => false,
				'message' => 'Вакансии успешно созданы',
			]);

			return $response;
		}

		$response->setData([
			'error' => true,
			'message' => 'Неправильная отправка данных',
		]);

		return $response;
	}

}