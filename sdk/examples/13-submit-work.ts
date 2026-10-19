import { MergeMintSDK, TESTNET, createNetworkConfig } from '../src';

/**
 * Recipe 13: Assignee signals that their work is ready for review.
 * Required accounts:
 * - Claimed assignee account
 */
async function main() {
  const contractId = process.env.CONTRACT_ID || 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM';
  const assignee = process.env.ASSIGNEE_ADDRESS || 'GD6W557C36X646QODPGFJVHDFGZ76A22CS5PB37X2G66Z3L56W557C36';
  const bountyId = process.argv[2] || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  const submission = process.env.SUBMISSION_NOTE || 'work-complete';

  const sdk = new MergeMintSDK(createNetworkConfig(TESTNET, contractId));

  console.log(`Submitting work on bounty ${bountyId}: "${submission}"`);
  const txXdr = await sdk.submitWork(
    {
      assignee,
      bountyId,
      submission,
    },
    assignee
  );

  console.log('Submit work transaction XDR:');
  console.log(txXdr);
}

main().catch(console.error);
