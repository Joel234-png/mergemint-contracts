# Event Schema

Contract events emitted for indexer integration.

## Events

### bounty_created
- **Topics**: `(Symbol("bounty_created"), creator_address)`
- **Data**: `(bounty_id, reward_amount)`
- **Trigger**: New bounty created
- **Purpose**: Notify indexer of new bounty

### bounty_claimed
- **Topics**: `(Symbol("bounty_claimed"), contributor_address)`
- **Data**: `bounty_id`
- **Trigger**: Contributor claims bounty
- **Purpose**: Notify indexer of bounty assignment

### bounty_disputed
- **Topics**: `(Symbol("bounty_disputed"), caller_address)`
- **Data**: `bounty_id`
- **Trigger**: Dispute raised on bounty
- **Purpose**: Notify indexer of dispute

### bounty_completed
- **Topics**: `(Symbol("bounty_completed"), contributor_address)`
- **Data**: `bounty_id`
- **Trigger**: Bounty completed and reward paid
- **Purpose**: Notify indexer of completion

### reward_paid
- **Topics**: `(Symbol("reward_paid"), contributor_address)`
- **Data**: `(bounty_id, amount)`
- **Trigger**: Token transfer confirmed
- **Purpose**: Confirm payment to indexer

### bounty_cancelled
- **Topics**: `(Symbol("bounty_cancelled"), creator_address)`
- **Data**: `bounty_id`
- **Trigger**: Creator cancels bounty
- **Purpose**: Notify indexer of bounty cancellation

### bounty_expired
- **Topics**: `(Symbol("bounty_expired"), creator_address)`
- **Data**: `bounty_id`
- **Trigger**: Bounty reaches deadline without completion
- **Purpose**: Notify indexer of bounty expiration

### bounty_reopened
- **Topics**: `(Symbol("bounty_reopened"), creator_address)`
- **Data**: `(bounty_id, new_deadline)`
- **Trigger**: Creator reopens an expired bounty via `reopen_bounty`
- **Purpose**: Notify indexer that an expired bounty is open again with a new deadline

### bounty_reassigned
- **Topics**: `(Symbol("bounty_reassigned"), old_assignee_address)`
- **Data**: `(bounty_id, new_assignee_address)`
- **Trigger**: Creator reassigns a claimed bounty via `reassign_bounty`
- **Purpose**: Notify indexer that the assignee on an in-progress bounty changed

### bounty_sponsored
- **Topics**: `(Symbol("bounty_sponsored"), sponsor_address)`
- **Data**: `(bounty_id, amount, new_reward_amount)`
- **Trigger**: A third party co-funds a bounty via `sponsor_bounty`
- **Purpose**: Notify indexer of additional escrowed funds and the sponsor's contribution

### work_submitted
- **Topics**: `(Symbol("work_submitted"), assignee_address)`
- **Data**: `(bounty_id, submission_hash)`
- **Trigger**: Assignee submits work via `submit_work`
- **Purpose**: Notify indexer/verifiers that a bounty is ready for review

### approval_recorded
- **Topics**: `(Symbol("approval_recorded"), verifier_address)`
- **Data**: `(bounty_id, approval_count)`
- **Trigger**: Verifier approves completion
- **Purpose**: Notify indexer of verification progress

### dispute_resolved
- **Topics**: `(Symbol("dispute_resolved"), arbitrator_address)`
- **Data**: `(bounty_id, resolution)`
- **Trigger**: Arbitrator resolves dispute
- **Purpose**: Notify indexer of dispute outcome

### milestone_completed
- **Topics**: `(Symbol("milestone_completed"), milestone_index)`
- **Data**: `(bounty_id, amount)`
- **Trigger**: A milestone is completed and its staged reward paid
- **Purpose**: Notify indexer of milestone-level progress

### contributor_metadata_updated
- **Topics**: `(Symbol("contributor_metadata_updated"), contributor_address)`
- **Data**: `metadata`
- **Trigger**: Contributor metadata is updated via `update_contributor_metadata`
- **Purpose**: Notify indexer of contributor profile changes so cached profiles stay fresh

## Queries

### get_contributor_bounty_history
- **Params**: `(contributor_address, offset: u32, limit: u32)`
- **Returns**: `Vec<BountyId>` — the contributor's bounties, newest first
- **Paging**: `offset` skips the most recent `offset` entries; `limit` caps the page size and is clamped to `MAX_HISTORY_PAGE_SIZE`
- **Purpose**: Bounded, paginated lookup of a contributor's bounty history for profile pages and SDK consumers
