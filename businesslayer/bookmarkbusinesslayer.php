<?php

/**
 * ownCloud - Music app
 *
 * This file is licensed under the Affero General Public License version 3 or
 * later. See the COPYING file.
 *
 * @author Gavin E <no.emai@address.for.me>
 * @author Pauli Järvinen <pauli.jarvinen@gmail.com>
 * @copyright Gavin E 2020
 * @copyright Pauli Järvinen 2020
 */

namespace OCA\Music\BusinessLayer;

use \OCA\Music\AppFramework\BusinessLayer\BusinessLayer;
use \OCA\Music\AppFramework\Core\Logger;

use \OCA\Music\Db\BaseMapper;
use \OCA\Music\Db\BookmarkMapper;
use \OCA\Music\Db\Bookmark;

use \OCA\Music\Utility\Util;

use \OCP\AppFramework\Db\DoesNotExistException;


class BookmarkBusinessLayer extends BusinessLayer {
	protected $mapper; // eclipse the definition from the base class, to help IDE and Scrutinizer to know the actual type
	private $logger;

	public function __construct(BookmarkMapper $bookmarkMapper, Logger $logger) {
		parent::__construct($bookmarkMapper);
		$this->mapper = $bookmarkMapper;
		$this->logger = $logger;
	}

	/**
	 * @param string $userId
	 * @param int $trackId
	 * @param int $position
	 * @param string|null $comment
	 * @return Bookmark
	 */
	public function addOrUpdate($userId, $trackId, $position, $comment) {
		$updateTime = new \DateTime();
		$updateTime = $updateTime->format(BaseMapper::SQL_DATE_FORMAT);

		try {
			$bookmark = $this->findByTrack($trackId, $userId);
		} catch (DoesNotExistException $e) {
			$bookmark = new Bookmark();
			$bookmark->setCreated($updateTime);
		}

		$bookmark->setUserId($userId);
		$bookmark->setTrackId($trackId);
		$bookmark->setPosition($position);
		$bookmark->setComment(Util::truncate($comment, 256));
		$bookmark->setUpdated($updateTime);

		return $this->mapper->insertOrUpdate($bookmark);
	}

	/**
	 * @param int $trackId
	 * @param string $userId
	 * @throws DoesNotExistException if such bookmark does not exist
	 * @return Bookmark
	 */
	public function findByTrack($trackId, $userId) {
		return $this->mapper->findByTrack($trackId, $userId);
	}
}
