<?php

namespace Fuga\PublicBundle\Controller;

use Fuga\CommonBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;

class TavernController extends Controller
{
	public function index()
	{
		$news = $this->get('container')->getItem('tavern_news', 'publish=1');
		$this->addCss('/bundles/public/css/app.chat.css');
		$this->addJs('/bundles/public/js/app.chat.js');

		return $this->render('tavern/index', compact('news'));
	}

	public function fresh()
	{
		$date = new \DateTime();
		$date->sub(new \DateInterval('P3D'));
		$q = $this->get('container')->getTable('tavern_news')->count('publish=1 AND created > "'.$date->format('Y-m-d H:i:s').'"');

		$response = new JsonResponse();
		$response->setData(array(
			'fresh' => $q > 0,
		));

		return $response;
	}
	
}