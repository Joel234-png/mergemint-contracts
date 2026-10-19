import { MergeMintSDK, TESTNET, createNetworkConfig } from '../src';

/**
 * Recipe 11: Creator reopens a bounty whose deadline expired so contributors
 * can claim and work on it again.  Required accounts:
 * - Bounty creator account
 */
async function main() {
  const contractId = process.env.CONTRACT_ID || 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM';
  const creator = process.env.CREATOR_ADDRESS || 'GD6W557C36X646QODPGFJVHDFGZ76A22CS5PB37X2G66Z3L56W557C36';
  const bountyId = process.argv[2] || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  const newDeadline = Number(process.env.NEW_DEADLINE || '9999999999');

  const sdk = new MergeMintSDK(createNetworkConfig(TESTNET, contractId));

  console.log(`Reopening bounty ${bountyId} with new deadline ${newDeadline}`);
  const txXdr = await sdk.reopenBounty(
    {
      creator,
      bountyId,
      newDeadline,
    },
    creator
  );

  console.log('Reopen transaction XDR:');
  console.log(txXdr);
}

main().catch(console.error);
