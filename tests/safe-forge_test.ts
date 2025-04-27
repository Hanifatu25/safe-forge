import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.2/index.ts';
import { assertEquals } from 'https://deno.land/std@0.170.0/testing/asserts.ts';

// Polyfill for Buffer in Deno environment
const textEncoder = new TextEncoder();
const stringToBuffer = (input: string) => textEncoder.encode(input);

// Error Constants (matching contract)
const ERR_NOT_AUTHORIZED = 1000;
const ERR_TEMPLATE_NOT_FOUND = 1001;
const ERR_TEMPLATE_ALREADY_EXISTS = 1002;
const ERR_INVALID_TEMPLATE = 1003;
const ERR_CONTRACT_GENERATION_FAILED = 1004;

Clarinet.test({
  name: "SafeForge: Initial admin setup - contract deployer should be first admin",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;

    // Check if deployer is an authorized admin
    const isAdmin = chain.callReadOnlyFn(
      'safe-forge', 
      'is-authorized-admin', 
      [types.principal(deployer.address)], 
      deployer.address
    );
    
    isAdmin.result.expectBool(true);
  }
});

// Admin Management Tests
Clarinet.test({
  name: "SafeForge: Adding a new admin by existing admin should succeed",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet1 = accounts.get('wallet_1')!;

    // Add a new admin
    const block = chain.mineBlock([
      Tx.contractCall(
        'safe-forge', 
        'add-admin', 
        [types.principal(wallet1.address)], 
        deployer.address
      )
    ]);

    // Check transaction result
    block.receipts[0].result.expectOk().expectBool(true);

    // Verify admin status
    const isAdmin = chain.callReadOnlyFn(
      'safe-forge', 
      'is-authorized-admin', 
      [types.principal(wallet1.address)], 
      deployer.address
    );
    
    isAdmin.result.expectBool(true);
  }
});

Clarinet.test({
  name: "SafeForge: Preventing unauthorized admin addition",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const wallet1 = accounts.get('wallet_1')!;
    const wallet2 = accounts.get('wallet_2')!;

    // Try to add an admin from a non-admin account
    const block = chain.mineBlock([
      Tx.contractCall(
        'safe-forge', 
        'add-admin', 
        [types.principal(wallet2.address)], 
        wallet1.address
      )
    ]);

    // Check transaction should fail with not authorized error
    block.receipts[0].result.expectErr().expectUint(ERR_NOT_AUTHORIZED);

    // Verify wallet2 is not an admin
    const isAdmin = chain.callReadOnlyFn(
      'safe-forge', 
      'is-authorized-admin', 
      [types.principal(wallet2.address)], 
      wallet1.address
    );
    
    isAdmin.result.expectBool(false);
  }
});

// Template Registration Tests
Clarinet.test({
  name: "SafeForge: Successfully register a new template by admin",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;

    // Register a valid template
    const block = chain.mineBlock([
      Tx.contractCall(
        'safe-forge', 
        'register-template', 
        [
          types.ascii("test-template"),
          types.buff(stringToBuffer("contract-code-here"))
        ], 
        deployer.address
      )
    ]);

    // Check transaction result
    block.receipts[0].result.expectOk().expectBool(true);
  }
});

Clarinet.test({
  name: "SafeForge: Prevent duplicate template registration",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;

    // First registration
    const block1 = chain.mineBlock([
      Tx.contractCall(
        'safe-forge', 
        'register-template', 
        [
          types.ascii("duplicate-template"),
          types.buff(stringToBuffer("first-version"))
        ], 
        deployer.address
      )
    ]);
    block1.receipts[0].result.expectOk().expectBool(true);

    // Try to register same template again
    const block2 = chain.mineBlock([
      Tx.contractCall(
        'safe-forge', 
        'register-template', 
        [
          types.ascii("duplicate-template"),
          types.buff(Buffer.from("second-version"))
        ], 
        deployer.address
      )
    ]);

    // Should fail with template already exists error
    block2.receipts[0].result.expectErr().expectUint(ERR_TEMPLATE_ALREADY_EXISTS);
  }
});

Clarinet.test({
  name: "SafeForge: Prevent unauthorized template registration",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const wallet1 = accounts.get('wallet_1')!;

    // Try to register template from non-admin account
    const block = chain.mineBlock([
      Tx.contractCall(
        'safe-forge', 
        'register-template', 
        [
          types.ascii("unauthorized-template"),
          types.buff(Buffer.from("template-code"))
        ], 
        wallet1.address
      )
    ]);

    // Should fail with not authorized error
    block.receipts[0].result.expectErr().expectUint(ERR_NOT_AUTHORIZED);
  }
});

// Template Approval Tests
Clarinet.test({
  name: "SafeForge: Approve template by authorized admin",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;

    // First, register the template
    const registerBlock = chain.mineBlock([
      Tx.contractCall(
        'safe-forge', 
        'register-template', 
        [
          types.ascii("approval-template"),
          types.buff(Buffer.from("approvable-code"))
        ], 
        deployer.address
      )
    ]);
    registerBlock.receipts[0].result.expectOk().expectBool(true);

    // Now approve the template
    const approveBlock = chain.mineBlock([
      Tx.contractCall(
        'safe-forge', 
        'approve-template', 
        [types.ascii("approval-template")], 
        deployer.address
      )
    ]);

    // Check approval result
    approveBlock.receipts[0].result.expectOk().expectBool(true);
  }
});

Clarinet.test({
  name: "SafeForge: Prevent unauthorized template approval",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet1 = accounts.get('wallet_1')!;

    // First, register the template
    const registerBlock = chain.mineBlock([
      Tx.contractCall(
        'safe-forge', 
        'register-template', 
        [
          types.ascii("unapproved-template"),
          types.buff(Buffer.from("sample-code"))
        ], 
        deployer.address
      )
    ]);
    registerBlock.receipts[0].result.expectOk().expectBool(true);

    // Try to approve from non-admin account
    const approveBlock = chain.mineBlock([
      Tx.contractCall(
        'safe-forge', 
        'approve-template', 
        [types.ascii("unapproved-template")], 
        wallet1.address
      )
    ]);

    // Should fail with not authorized error
    approveBlock.receipts[0].result.expectErr().expectUint(ERR_NOT_AUTHORIZED);
  }
});

// Contract Generation Tests
Clarinet.test({
  name: "SafeForge: Generate contract from approved template",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;

    // Register template
    const registerBlock = chain.mineBlock([
      Tx.contractCall(
        'safe-forge', 
        'register-template', 
        [
          types.ascii("gen-template"),
          types.buff(Buffer.from("generation-code"))
        ], 
        deployer.address
      )
    ]);
    registerBlock.receipts[0].result.expectOk().expectBool(true);

    // Approve template
    const approveBlock = chain.mineBlock([
      Tx.contractCall(
        'safe-forge', 
        'approve-template', 
        [types.ascii("gen-template")], 
        deployer.address
      )
    ]);
    approveBlock.receipts[0].result.expectOk().expectBool(true);

    // Generate contract
    const generateBlock = chain.mineBlock([
      Tx.contractCall(
        'safe-forge', 
        'generate-contract', 
        [
          types.ascii("gen-template"),
          types.buff(Buffer.from("deployment-data"))
        ], 
        deployer.address
      )
    ]);

    // Should succeed and return event details
    const result = generateBlock.receipts[0].result;
    result.expectOk();
    
    // Basic validation of return object
    const generatedContract = result.value;
    assertEquals(generatedContract.hasOwnProperty('event-id'), true);
    assertEquals(generatedContract.hasOwnProperty('template-name'), true);
  }
});

Clarinet.test({
  name: "SafeForge: Prevent contract generation from unapproved template",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;

    // Register but DO NOT approve template
    const registerBlock = chain.mineBlock([
      Tx.contractCall(
        'safe-forge', 
        'register-template', 
        [
          types.ascii("unapproved-gen-template"),
          types.buff(Buffer.from("generation-code"))
        ], 
        deployer.address
      )
    ]);
    registerBlock.receipts[0].result.expectOk().expectBool(true);

    // Try to generate contract from unapproved template
    const generateBlock = chain.mineBlock([
      Tx.contractCall(
        'safe-forge', 
        'generate-contract', 
        [
          types.ascii("unapproved-gen-template"),
          types.buff(Buffer.from("deployment-data"))
        ], 
        deployer.address
      )
    ]);

    // Should fail with invalid template error
    generateBlock.receipts[0].result.expectErr().expectUint(ERR_INVALID_TEMPLATE);
  }
});

// Error Handling and Security Boundary Tests
Clarinet.test({
  name: "SafeForge: Validate error handling for non-existent template",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;

    // Try to generate or approve non-existent template
    const approveBlock = chain.mineBlock([
      Tx.contractCall(
        'safe-forge', 
        'approve-template', 
        [types.ascii("non-existent-template")], 
        deployer.address
      )
    ]);

    // Should fail with template not found error
    approveBlock.receipts[0].result.expectErr().expectUint(ERR_TEMPLATE_NOT_FOUND);
  }
});