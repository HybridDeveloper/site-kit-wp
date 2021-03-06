/**
 * modules/adsense data store: URL channels tests.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import { STORE_NAME } from './constants';
import {
	createTestRegistry,
	muteConsole,
	subscribeUntil,
	unsubscribeFromAll,
} from 'tests/js/utils';
import * as fixtures from './__fixtures__';

describe( 'modules/adsense URL channels', () => {
	let apiFetchSpy;
	let registry;
	let store;

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
		store = registry.stores[ STORE_NAME ].store;

		apiFetchSpy = jest.spyOn( { apiFetch }, 'apiFetch' );
	} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
		apiFetchSpy.mockRestore();
	} );

	describe( 'actions', () => {

	} );

	describe( 'selectors', () => {
		describe( 'getURLChannels', () => {
			it( 'uses a resolver to make a network request', async () => {
				fetch
					.doMockOnceIf(
						/^\/google-site-kit\/v1\/modules\/adsense\/data\/urlchannels/
					)
					.mockResponseOnce(
						JSON.stringify( fixtures.urlchannels ),
						{ status: 200 }
					);

				const clientID = fixtures.clients[ 0 ].id;

				const initialURLChannels = registry.select( STORE_NAME ).getURLChannels( clientID );

				expect( initialURLChannels ).toEqual( undefined );
				await subscribeUntil( registry,
					() => (
						registry.select( STORE_NAME ).getURLChannels( clientID ) !== undefined
					),
				);

				const urlchannels = registry.select( STORE_NAME ).getURLChannels( clientID );

				expect( fetch ).toHaveBeenCalledTimes( 1 );
				expect( urlchannels ).toEqual( fixtures.urlchannels );
			} );

			it( 'does not make a network request if urlchannels for this account + client are already present', async () => {
				const clientID = fixtures.clients[ 0 ].id;

				// Load data into this store so there are matches for the data we're about to select,
				// even though the selector hasn't fulfilled yet.
				registry.dispatch( STORE_NAME ).receiveURLChannels( fixtures.urlchannels, { clientID } );

				const urlchannels = registry.select( STORE_NAME ).getURLChannels( clientID );

				await subscribeUntil( registry, () => registry
					.select( STORE_NAME )
					.hasFinishedResolution( 'getURLChannels', [ clientID ] )
				);

				expect( fetch ).not.toHaveBeenCalled();
				expect( urlchannels ).toEqual( fixtures.urlchannels );
			} );

			it( 'dispatches an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};
				fetch
					.doMockIf(
						/^\/google-site-kit\/v1\/modules\/adsense\/data\/urlchannels/
					)
					.mockResponse(
						JSON.stringify( response ),
						{ status: 500 }
					);

				const fakeClientID = 'ca-pub-777888999';

				muteConsole( 'error' );
				registry.select( STORE_NAME ).getURLChannels( fakeClientID );
				await subscribeUntil( registry,
					// TODO: We may want a selector for this, but for now this is fine
					// because it's internal-only.
					() => store.getState().isFetchingURLChannels[ fakeClientID ] === false,
				);

				expect( fetch ).toHaveBeenCalledTimes( 1 );

				const urlchannels = registry.select( STORE_NAME ).getURLChannels( fakeClientID );
				expect( urlchannels ).toEqual( undefined );
			} );

			it( 'dispatches an error when account ID cannot be parsed from client ID', async () => {
				const clientResponse = {
					code: 'invalid_param',
					message: 'The clientID parameter is not a valid AdSense client ID.',
					data: { status: 400 },
				};

				const invalidClientID = 'invalid-client-id';

				registry.select( STORE_NAME ).getURLChannels( invalidClientID );
				await subscribeUntil( registry,
					// TODO: We may want a selector for this, but for now this is fine
					// because it's internal-only.
					() => store.getState().isFetchingURLChannels[ invalidClientID ] === false,
				);

				expect( fetch ).toHaveBeenCalledTimes( 0 );

				const urlchannels = registry.select( STORE_NAME ).getURLChannels( invalidClientID );
				expect( urlchannels ).toEqual( undefined );
				expect( store.getState().error ).toEqual( clientResponse );
			} );
		} );
	} );
} );
