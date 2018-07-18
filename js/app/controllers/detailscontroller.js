/**
 * ownCloud - Music app
 *
 * This file is licensed under the Affero General Public License version 3 or
 * later. See the COPYING file.
 *
 * @author Pauli Järvinen <pauli.jarvinen@gmail.com>
 * @copyright Pauli Järvinen 2018
 */


angular.module('Music').controller('DetailsController', [
	'$rootScope', '$scope', 'Restangular', '$timeout', 'libraryService',
	function ($rootScope, $scope, Restangular, $timeout, libraryService) {

		$scope.follow = Cookies.get('oc_music_details_follow_playback') == 'true';

		var currentTrack = null;

		function getFileId(trackId) {
			var files = libraryService.getTrack(trackId).files;
			return files[Object.keys(files)[0]];
		}

		function toArray(obj) {
			return _.map(obj, function(val, key) {
				return {key: key, value: val};
			});
		}

		function createFormatSummary(fileInfo) {
			var summary = '';
			if (fileInfo.dataformat) {
				summary = fileInfo.dataformat;
			}
			if (fileInfo.bitrate_mode === 'vbr') {
				summary += ' VBR';
			}
			if (fileInfo.bitrate) {
				if ($.isNumeric(fileInfo.bitrate)) {
					summary += ' ' + Math.round(fileInfo.bitrate/1000) + ' kbps';
				} else {
					summary += ' ' + fileInfo.bitrate;
				}
			}
			if (summary === '') {
				summary = null;
			} else {
				summary += ' …';
			}
			return summary;
		}

		function adjustFixedPositions() {
			var sidebarWidth = $('#app-sidebar').outerWidth();
			var albumartWidth = $('#app-sidebar .albumart').outerWidth();
			var offset = sidebarWidth - albumartWidth;
			$('#app-sidebar .close').css('right', offset);
			$('#app-sidebar #follow-playback').css('right', offset);
		}

		function showDetails(trackId) {
			if (trackId != currentTrack) {
				currentTrack = trackId;
				$scope.details = null;
				$scope.formatSummary = null;
				$scope.formatExpanded = false;

				var albumart = $('#app-sidebar .albumart');
				albumart.css('background-image', '').css('height', '0');

				var fileId = getFileId(trackId);
				$('#path').attr('href', OC.generateUrl('/f/' + fileId));

				Restangular.one('file', fileId).one('details').get().then(function(result) {
					if (result.tags.picture) {
						albumart.css('background-image', 'url("' + result.tags.picture + '")');
						albumart.css('height', ''); // remove the inline height and use the one from the css file
					}

					delete result.tags.picture;
					$scope.details = {
							path: result.path,
							tags: toArray(result.tags),
							fileinfo: toArray(result.fileinfo)
					};
					$scope.formatSummary = createFormatSummary(result.fileinfo);
					$timeout(adjustFixedPositions);
				});
			}
		}

		$rootScope.$on('showDetails', function(event, trackId) {
			OC.Apps.showAppSidebar();
			showDetails(trackId);
		});

		$rootScope.$on('hideDetails', function() {
			OC.Apps.hideAppSidebar();
		});

		$rootScope.$on('windowResized', adjustFixedPositions);

		$scope.$parent.$watch('currentTrack', function(track) {
			// show details for the current track if the feature is enabled
			if ($scope.follow && track && !$('#app-sidebar').hasClass('disappear')) {
				showDetails(track.id);
			}
		});

		$scope.formatDetailValue = function(value) {
			if ($.isNumeric(value)) {
				return Number(value.toPrecision(6));
			} else {
				return value;
			}
		};

		$scope.formatDetailName = function(rawName) {
			if (rawName === 'band' || rawName === 'albumartist') {
				return 'album artist';
			} else if (rawName === 'unsynchronised_lyric') {
				return 'lyrics';
			} else if (rawName === 'tracktotal') {
				return 'total tracks';
			} else if (rawName === 'part_of_a_set' || rawName === 'discnumber') {
				return 'disc number';
			} else {
				return rawName.replace(/_/g, ' ');
			}
		};

		$scope.tagRank = function(tag) {
			switch (tag.key) {
			case 'title':					return 1;
			case 'artist':					return 2;
			case 'album':					return 3;
			case 'albumartist':				return 4;
			case 'band':					return 4;
			case 'composer':				return 5;
			case 'part_of_a_set':			return 6;
			case 'discnumber':				return 6;
			case 'track_number':			return 7;
			case 'tracktotal':				return 8;
			case 'comment':					return 100;
			case 'unsynchronised_lyric':	return 101;
			default:						return 10;
			}
		};

		$scope.toggleFollow = function() {
			$scope.follow = !$scope.follow;
			Cookies.set('oc_music_details_follow_playback', $scope.follow.toString(), { expires: 3650 });
		};

		$scope.toggleFormatExpanded = function() {
			$scope.formatExpanded = !$scope.formatExpanded;
			$timeout(adjustFixedPositions);
		};
	}
]);
