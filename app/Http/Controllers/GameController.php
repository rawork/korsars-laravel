<?php

namespace Fuga\PublicBundle\Controller;

use Fuga\CommonBundle\Controller\Controller;

class GameController extends Controller
{
	public function index()
	{
		return $this->redirect('/');
	}
	
	public function dice()
	{
		$user = $this->getManager('Fuga:Common:User')->getCurrentUser();
		if (!$user || $user['group_id'] == FAN_GROUP) {
			return $this->render('game/access');
		}

		$this->get('container')->setVar('title', 'КОСТИ');
		$this->get('container')->setVar('h1', 'КОСТИ');
		$this->addCss('/bundles/public/css/sandbox.dice.css');
		$this->addJs('/bundles/public/js/sandbox.dice.js');

		return $this->render('game/dice');
	}

	public function task()
	{
		$user = $this->getManager('Fuga:Common:User')->getCurrentUser();
		if (!$user || $user['group_id'] == FAN_GROUP) {
			return $this->render('game/access');
		}

		$this->get('container')->setVar('title', 'СКОЛЬКО ДЕНЕГ НА ГАЛЕОНЕ?');
		$this->get('container')->setVar('h1', 'СКОЛЬКО ДЕНЕГ<br>НА ГАЛЕОНЕ?');
		$this->addCss('/bundles/public/css/sandbox.task.css');
		$this->addJs('/bundles/storage/jquery.storageapi.min.js');
		$this->addJs('/bundles/public/js/sandbox.task.js');

		return $this->render('game/task');
	}

	public function pexeso()
	{
		$user = $this->getManager('Fuga:Common:User')->getCurrentUser();
		if (!$user || $user['group_id'] == FAN_GROUP) {
			return $this->render('game/access');
		}

		$this->get('container')->setVar('title', 'ПОДГОТОВКА КОРАБЛЯ');
		$this->get('container')->setVar('h1', 'ПОДГОТОВКА КОРАБЛЯ');
		$this->addCss('/bundles/public/css/sandbox.pexeso.css');
		$this->addJs('/bundles/storage/jquery.storageapi.min.js');
		$this->addJs('/bundles/public/js/sandbox.pexeso.js');

		return $this->render('game/pexeso');
	}

	public function map()
	{
		$user = $this->getManager('Fuga:Common:User')->getCurrentUser();
		if (!$user || $user['group_id'] == FAN_GROUP) {
			return $this->render('game/access');
		}

		$this->get('container')->setVar('title', 'ЛОЦМАНСКАЯ КАРТА');
		$this->get('container')->setVar('h1', 'ЛОЦМАНСКАЯ КАРТА');
		$this->addCss('/bundles/public/css/sandbox.map.css');
		$this->addJs('/bundles/public/js/sandbox.map.js');

		return $this->render('game/map');
	}

	public function labirint()
	{
		$user = $this->getManager('Fuga:Common:User')->getCurrentUser();
		if (!$user || $user['group_id'] == FAN_GROUP) {
			return $this->render('game/access');
		}

		$this->get('container')->setVar('title', 'АБОРДАЖ ГАЛЕОНА');
		$this->get('container')->setVar('h1', 'АБОРДАЖ ГАЛЕОНА');
		$this->addCss('/bundles/public/css/sandbox.labirint.css');
		$this->addJs('/bundles/storage/jquery.storageapi.min.js');
		$this->addJs('/bundles/public/js/sandbox.labirint.js');

		return $this->render('game/labirint');
	}

	public function market()
	{
		$user = $this->getManager('Fuga:Common:User')->getCurrentUser();
		if (!$user || $user['group_id'] == FAN_GROUP) {
			return $this->render('game/access');
		}

		$this->get('container')->setVar('title', 'ПРОДАЖА НАГРАБЛЕННОГО');
		$this->get('container')->setVar('h1', 'ПРОДАЖА НАГРАБЛЕННОГО');
		$this->addCss('/bundles/public/css/sandbox.market.css');
		$this->addJs('/bundles/storage/jquery.storageapi.min.js');
		$this->addJs('/bundles/public/js/sandbox.market.js');

		return $this->render('game/market');
	}

	public function battle()
	{
		$user = $this->getManager('Fuga:Common:User')->getCurrentUser();
		if (!$user || $user['group_id'] == FAN_GROUP) {
			return $this->render('game/access');
		}

		$this->get('container')->setVar('title', 'МОРСКОЙ БОЙ');
		$this->get('container')->setVar('h1', 'МОРСКОЙ БОЙ');
		$this->addCss('/bundles/public/css/battle.chat.css');
		$this->addCss('/bundles/public/css/sandbox.battle.css');
		$this->addJs('/bundles/storage/jquery.storageapi.min.js');
		$this->addJs('/bundles/public/js/sandbox.battle.js');


		return $this->render('game/battle');
	}

	public function duel()
	{
		$user = $this->getManager('Fuga:Common:User')->getCurrentUser();
		if (!$user || $user['group_id'] == FAN_GROUP) {
			return $this->render('game/access');
		}

		$this->get('container')->setVar('title', 'ДУЭЛЬ КАПИТАНОВ');
		$this->get('container')->setVar('h1', 'ДУЭЛЬ КАПИТАНОВ');
		$this->addCss('/bundles/public/css/sandbox.duel.css');
		$this->addJs('/bundles/storage/jquery.storageapi.min.js');
		$this->addJs('/bundles/public/js/sandbox.duel.js');

		return $this->render('game/duel');
	}

}