import { MergeMintSDK, TESTNET, createNetworkConfig } from '../src';

/**
 * Recipe 12: Creator hands a claimed bounty to a different contributor when
 * the original assignee goes silent.  Required accounts:
 * - Bounty creator account
 * - New assignee address
 */
async function main() {
  const contractId = process.env.CONTRACT_ID || 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM';
  const creator = process.env.CREATOR_ADDRESS || 'GD6W557C36X646QODPGFJVHDFGZ76A22CS5PB37X2G66Z3L56W557C36';
  const newAssignee = process.env.NEW_ASSIGNEE_ADDRESS || 'GD6W557C36X646QODPGFJVHDFGZ76A22CS5PB37X2G66Z3L56W557C36';
  const bountyId = process.argv[2] || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

  const sdk = new MergeMintSDK(createNetworkConfig(TESTNET, contractId));

  console.log(`Reassigning bounty ${bountyId} to ${newAssignee}`);
  const txXdr = await sdk.reassignBounty(
    {
      creator,
      bountyId,
      newAssignee,
    },
    creator
  );

  console.log('Reassign transaction XDR:');
  console.log(txXdr);
}

main().catch(console.error);
