/**
 * Internal dependencies
 */
import { activateOrDeactivateModule } from '../';

const valuesToTest = [
	[
		'analytics',
		true,
		true,
	],
	[
		'analytics',
		false,
		false,
	],
	[
		'adsense',
		true,
		true,
	],
	[
		'adsense',
		false,
		false,
	],
];

const restApiClient = {
	setModuleActive( slug, status ) {
		return {
			then() {
				return status;
			},
		};
	},
};

describe( 'activateOrDeactivateModule', () => {
	it.each( valuesToTest )( 'should turn status for module %s to %p', ( module, status, expected ) => {
		expect( activateOrDeactivateModule( restApiClient, module, status ) ).toStrictEqual( expected );
	} );
} );
