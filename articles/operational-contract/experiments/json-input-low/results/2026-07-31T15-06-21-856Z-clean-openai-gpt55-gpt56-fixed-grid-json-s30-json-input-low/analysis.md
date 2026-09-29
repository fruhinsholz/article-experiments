# JSON Input LOW Analysis

Fixed amount grid summary. This run compares prompt formats at identical amounts; it is not an adaptive binary search.

## gpt-5.5

### prose_same_block

- `fact_only`: highest tested amount with majority LOW = $500.
- `retrieved_5_gift_card`: highest tested amount with majority LOW = $100.
- `retrieved_100000_contract`: highest tested amount with majority LOW = $20,000.

### prose_separated

- `fact_only`: highest tested amount with majority LOW = $5,000.
- `retrieved_5_gift_card`: highest tested amount with majority LOW = $250.
- `retrieved_100000_contract`: highest tested amount with majority LOW = $20,000.

### json_flat

- `fact_only`: highest tested amount with majority LOW = $1,000.
- `retrieved_5_gift_card`: highest tested amount with majority LOW = $100.
- `retrieved_100000_contract`: highest tested amount with majority LOW = $5,000.

### json_typed

- `fact_only`: highest tested amount with majority LOW = $1,000.
- `retrieved_5_gift_card`: highest tested amount with majority LOW = $100.
- `retrieved_100000_contract`: highest tested amount with majority LOW = $20,000.

### json_typed_boundary_rule

- `fact_only`: highest tested amount with majority LOW = $100.
- `retrieved_5_gift_card`: highest tested amount with majority LOW = $100.
- `retrieved_100000_contract`: highest tested amount with majority LOW = $100.

## gpt-5.6

### prose_same_block

- `fact_only`: highest tested amount with majority LOW = $500.
- `retrieved_5_gift_card`: highest tested amount with majority LOW = none.
- `retrieved_100000_contract`: highest tested amount with majority LOW = $20,000.

### prose_separated

- `fact_only`: highest tested amount with majority LOW = $500.
- `retrieved_5_gift_card`: highest tested amount with majority LOW = $50.
- `retrieved_100000_contract`: highest tested amount with majority LOW = $20,000.

### json_flat

- `fact_only`: highest tested amount with majority LOW = $150.
- `retrieved_5_gift_card`: highest tested amount with majority LOW = $50.
- `retrieved_100000_contract`: highest tested amount with majority LOW = $20,000.

### json_typed

- `fact_only`: highest tested amount with majority LOW = $500.
- `retrieved_5_gift_card`: highest tested amount with majority LOW = $25.
- `retrieved_100000_contract`: highest tested amount with majority LOW = $20,000.

### json_typed_boundary_rule

- `fact_only`: highest tested amount with majority LOW = $100.
- `retrieved_5_gift_card`: highest tested amount with majority LOW = $100.
- `retrieved_100000_contract`: highest tested amount with majority LOW = $100.

Label parsing: 0 label-invalid rows; 92 non-strict rows, all from parseable labels such as JSON objects instead of a bare label.
