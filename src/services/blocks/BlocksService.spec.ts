/* eslint-disable @typescript-eslint/no-unsafe-call */
import { ApiPromise } from '@polkadot/api';
import { AugmentedConst } from '@polkadot/api/types/consts';
import { RpcPromiseResult } from '@polkadot/api/types/rpc';
import { GenericExtrinsic } from '@polkadot/types';
import { GenericCall } from '@polkadot/types/generic';
import {
	BalanceOf,
	BlockHash,
	Hash,
	SignedBlock,
} from '@polkadot/types/interfaces';
import { BadRequest } from 'http-errors';

import { sanitizeNumbers } from '../../sanitize/sanitizeNumbers';
import { createCall } from '../../test-helpers/createCall';
import {
	kusamaRegistry,
	polkadotRegistry,
} from '../../test-helpers/registries';
import { IExtrinsic } from '../../types/responses/';
import {
	blockHash789629,
	getBlock,
	mockApi,
	mockBlock789629,
	mockForkedBlock789629,
} from '../test-helpers/mock';
import block789629 from '../test-helpers/mock/data/block789629.json';
import { parseNumberOrThrow } from '../test-helpers/mock/parseNumberOrThrow';
import block789629Extrinsic from '../test-helpers/responses/blocks/block789629Extrinsic.json';
import blocks789629Response from '../test-helpers/responses/blocks/blocks789629.json';
import { BlocksService } from './BlocksService';

/**
 * For type casting mock getBlock functions so tsc does not complain
 */
type GetBlock = RpcPromiseResult<
	(hash?: string | BlockHash | Uint8Array | undefined) => Promise<SignedBlock>
>;

/**
 * Interface for the reponse in `fetchBlock` test suite
 */
interface ResponseObj {
	extrinsics: IExtrinsic[];
}

/**
 * BlockService mock
 */
const blocksService = new BlocksService(mockApi);

describe('BlocksService', () => {
	describe('fetchBlock', () => {
		it('works when ApiPromise works (block 789629)', async () => {
			// fetchBlock options
			const options = {
				eventDocs: true,
				extrinsicDocs: true,
				checkFinalized: false,
				queryFinalizedHead: false,
				omitFinalizedTag: false,
			};

			expect(
				sanitizeNumbers(
					await blocksService.fetchBlock(blockHash789629, options)
				)
			).toMatchObject(blocks789629Response);
		});

		it('throws when an extrinsic is undefined', async () => {
			// Create a block with undefined as the first extrinisic and the last extrinsic removed
			const mockBlock789629BadExt = polkadotRegistry.createType(
				'Block',
				block789629
			);

			mockBlock789629BadExt.extrinsics.pop();

			mockBlock789629BadExt.extrinsics.unshift(
				(undefined as unknown) as GenericExtrinsic
			);

			// fetchBlock Options
			const options = {
				eventDocs: false,
				extrinsicDocs: false,
				checkFinalized: false,
				queryFinalizedHead: false,
				omitFinalizedTag: false,
			};

			mockApi.rpc.chain.getBlock = (() =>
				Promise.resolve().then(() => {
					return {
						block: mockBlock789629BadExt,
					};
				}) as unknown) as GetBlock;

			await expect(
				blocksService.fetchBlock(blockHash789629, options)
			).rejects.toThrow(
				new Error(
					`Cannot destructure property 'method' of 'extrinsic' as it is undefined.`
				)
			);

			mockApi.rpc.chain.getBlock = (getBlock as unknown) as GetBlock;
		});

		it('Returns the finalized tag as undefined when omitFinalizedTag equals true', async () => {
			// fetchBlock options
			const options = {
				eventDocs: true,
				extrinsicDocs: true,
				checkFinalized: false,
				queryFinalizedHead: false,
				omitFinalizedTag: true,
			};

			const block = await blocksService.fetchBlock(blockHash789629, options);

			expect(block.finalized).toEqual(undefined);
		});

		it('Return an error with a null calcFee when perByte is undefined', async () => {
			mockApi.consts.transactionPayment.transactionByteFee = (undefined as unknown) as BalanceOf &
				AugmentedConst<'promise'>;

			const configuredBlocksService = new BlocksService(mockApi);

			// fetchBlock options
			const options = {
				eventDocs: true,
				extrinsicDocs: true,
				checkFinalized: false,
				queryFinalizedHead: false,
				omitFinalizedTag: false,
			};

			const response = sanitizeNumbers(
				await configuredBlocksService.fetchBlock(blockHash789629, options)
			);

			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const responseObj: ResponseObj = JSON.parse(JSON.stringify(response));

			// Revert mockApi back to its original setting that was changed above.
			mockApi.consts.transactionPayment.transactionByteFee = polkadotRegistry.createType(
				'Balance',
				1000000
			) as BalanceOf & AugmentedConst<'promise'>;

			expect(responseObj.extrinsics[3].info).toEqual({
				error: 'Fee calculation not supported for 16#polkadot',
			});
		});
	});

	describe('createCalcFee & calc_fee', () => {
		it('calculates partialFee for proxy.proxy in polkadot block 789629', async () => {
			// tx hash: 0x6d6c0e955650e689b14fb472daf14d2bdced258c748ded1d6cb0da3bfcc5854f
			const { calcFee } = await blocksService['createCalcFee'](
				mockApi,
				('0xParentHash' as unknown) as Hash,
				mockBlock789629
			);

			expect(calcFee?.calc_fee(BigInt(399480000), 534, BigInt(125000000))).toBe(
				'544000000'
			);
		});

		it('calculates partialFee for utility.batch in polkadot block 789629', async () => {
			// tx hash: 0xc96b4d442014fae60c932ea50cba30bf7dea3233f59d1fe98c6f6f85bfd51045
			const { calcFee } = await blocksService['createCalcFee'](
				mockApi,
				('0xParentHash' as unknown) as Hash,
				mockBlock789629
			);

			expect(
				calcFee?.calc_fee(BigInt(941325000000), 1247, BigInt(125000000))
			).toBe('1257000075');
		});
	});

	describe('BlocksService.parseGenericCall', () => {
		const transfer = createCall('balances', 'transfer', {
			value: 12,
			dest: kusamaRegistry.createType(
				'AccountId',
				'14E5nqKAp3oAJcmzgZhUD2RcptBeUBScxKHgJKU4HPNcKVf3'
			), // Bob
		});

		const transferOutput = {
			method: {
				pallet: 'balances',
				method: 'transfer',
			},
			args: {
				dest: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
				value: 12,
			},
		};

		it('does not handle an empty object', () =>
			expect(() =>
				blocksService['parseGenericCall'](
					({} as unknown) as GenericCall,
					mockBlock789629.registry
				)
			).toThrow());

		it('parses a simple balances.transfer', () => {
			expect(
				JSON.stringify(
					blocksService['parseGenericCall'](transfer, mockBlock789629.registry)
				)
			).toBe(JSON.stringify(transferOutput));
		});

		it('parses utility.batch nested 4 deep', () => {
			const batch1 = createCall('utility', 'batch', {
				calls: [transfer],
			});

			const batch2 = createCall('utility', 'batch', {
				calls: [batch1, transfer],
			});

			const batch3 = createCall('utility', 'batch', {
				calls: [batch2, transfer],
			});

			const batch4 = createCall('utility', 'batch', {
				calls: [batch3, transfer],
			});

			const baseBatch = {
				method: {
					pallet: 'utility',
					method: 'batch',
				},
				args: {
					calls: [],
				},
			};

			expect(
				JSON.stringify(
					blocksService['parseGenericCall'](batch4, mockBlock789629.registry)
				)
			).toBe(
				JSON.stringify({
					...baseBatch,
					args: {
						calls: [
							{
								...baseBatch,
								args: {
									calls: [
										{
											...baseBatch,
											args: {
												calls: [
													{
														...baseBatch,
														args: {
															calls: [transferOutput],
														},
													},
													transferOutput,
												],
											},
										},
										transferOutput,
									],
								},
							},
							transferOutput,
						],
					},
				})
			);
		});

		it('handles a batch sudo proxy transfer', () => {
			const proxy = createCall('proxy', 'proxy', {
				forceProxyType: 'Any',
				call: transfer,
			});

			const sudo = createCall('sudo', 'sudo', {
				call: proxy,
			});

			const batch = createCall('utility', 'batch', {
				calls: [sudo, sudo, sudo],
			});

			const sudoOutput = {
				method: {
					pallet: 'sudo',
					method: 'sudo',
				},
				args: {
					call: {
						method: {
							pallet: 'proxy',
							method: 'proxy',
						},
						args: {
							real: '5C4hrfjw9DjXZTzV3MwzrrAr9P1MJhSrvWGWqi1eSuyUpnhM',
							force_proxy_type: 'Any',
							call: transferOutput,
						},
					},
				},
			};

			expect(
				JSON.stringify(
					blocksService['parseGenericCall'](batch, mockBlock789629.registry)
				)
			).toEqual(
				JSON.stringify({
					method: {
						pallet: 'utility',
						method: 'batch',
					},
					args: {
						calls: [sudoOutput, sudoOutput, sudoOutput],
					},
				})
			);
		});
	});

	describe('BlockService.isFinalizedBlock', () => {
		const finalizedHead = polkadotRegistry.createType(
			'BlockHash',
			'0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3'
		);

		const blockNumber = polkadotRegistry.createType(
			'Compact<BlockNumber>',
			789629
		);

		it('Returns false when queried blockId is not canonical', async () => {
			const getHeader = (_hash: Hash) =>
				Promise.resolve().then(() => mockForkedBlock789629.header);

			const getBlockHash = (_zero: number) =>
				Promise.resolve().then(() => finalizedHead);

			const forkMockApi = {
				rpc: {
					chain: {
						getHeader,
						getBlockHash,
					},
				},
			} as ApiPromise;

			const queriedHash = polkadotRegistry.createType(
				'BlockHash',
				'0x7b713de604a99857f6c25eacc115a4f28d2611a23d9ddff99ab0e4f1c17a8578'
			);

			expect(
				await blocksService['isFinalizedBlock'](
					forkMockApi,
					blockNumber,
					queriedHash,
					finalizedHead,
					true
				)
			).toEqual(false);
		});

		it('Returns true when queried blockId is canonical', async () => {
			expect(
				await blocksService['isFinalizedBlock'](
					mockApi,
					blockNumber,
					finalizedHead,
					finalizedHead,
					true
				)
			).toEqual(true);
		});
	});

	describe('fetchExrinsicByIndex', () => {
		// fetchBlock options
		const options = {
			eventDocs: false,
			extrinsicDocs: false,
			checkFinalized: false,
			queryFinalizedHead: false,
			omitFinalizedTag: false,
		};

		it('Returns the correct extrinisics object for block 789629', async () => {
			const block = await blocksService.fetchBlock(blockHash789629, options);

			/**
			 * The `extrinsicIndex` (second param) is being tested for a non-zero
			 * index here.
			 */
			const extrinsic = blocksService['fetchExtrinsicByIndex'](block, 2);

			expect(JSON.stringify(sanitizeNumbers(extrinsic))).toEqual(
				JSON.stringify(block789629Extrinsic)
			);
		});

		it("Throw an error when `extrinsicIndex` doesn't exist", async () => {
			const block = await blocksService.fetchBlock(blockHash789629, options);

			expect(() => {
				blocksService['fetchExtrinsicByIndex'](block, 5);
			}).toThrow(new BadRequest('Requested `extrinsicIndex` does not exist'));
		});

		it('Throw an error when param `extrinsicIndex` is less than 0', () => {
			expect(() => {
				parseNumberOrThrow(
					'-5',
					'`exstrinsicIndex` path param is not a number'
				);
			}).toThrow(
				new BadRequest('`exstrinsicIndex` path param is not a number')
			);
		});
	});
});
