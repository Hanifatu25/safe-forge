# Safe Forge

## Project Overview
**Safe Forge: A Secure Contract Generation System for Stacks**

Safe Forge is a secure system for generating smart contracts on the Stacks blockchain, providing controlled and auditable contract creation mechanisms. It allows for the creation of new contracts in a secure and managed way, ensuring that only authorized parties can generate contracts and that the process is thoroughly tracked and documented.

Key features of Safe Forge:
- Centralized contract generation with controlled access
- Auditable contract creation process
- Secure contract templates and deployment
- Error handling and validation to ensure contract integrity

## Contract Architecture

The Safe Forge contract is the main component of this project, responsible for managing the contract generation process. It consists of the following key elements:

### Data Structures
- `admin-list`: A map that stores the addresses of authorized contract administrators.
- `contract-templates`: A map that stores the approved contract templates, indexed by a unique template ID.
- `generated-contracts`: A map that tracks all the contracts that have been generated using Safe Forge, indexed by the contract's principal address.

### Public Functions
- `register-template`: Allows an admin to register a new contract template, associating it with a unique template ID.
- `approve-template`: Enables an admin to approve a registered template, making it available for contract generation.
- `generate-contract`: Allows an authorized user to generate a new contract based on an approved template.
- `add-admin`: Permits an existing admin to add a new admin to the `admin-list`.
- `remove-admin`: Allows an admin to remove another admin from the `admin-list`.

The contract uses a permission model that restricts access to sensitive functions, such as template registration and admin management, to authorized administrators only. All contract generation activities are recorded in the `generated-contracts` map for audit purposes.

## Installation & Setup

Prerequisites:
- Clarinet (Clarity smart contract development tool)

Installation Steps:
1. Clone the `safe-forge` repository: `git clone https://github.com/example/safe-forge.git`
2. Navigate to the project directory: `cd safe-forge`
3. Install dependencies: `npm install`
4. Build the contract: `clarinet build`

## Usage Guide

### Registering a Contract Template
1. Call the `register-template` function, providing the template code and a unique template ID.
2. The admin who registered the template can then call `approve-template` to make it available for contract generation.

### Generating a New Contract
1. Call the `generate-contract` function, specifying the approved template ID and any required parameters.
2. The contract will be generated and its principal address will be recorded in the `generated-contracts` map.

### Managing Administrators
1. Use the `add-admin` function to grant admin privileges to a new principal.
2. Use the `remove-admin` function to revoke admin privileges from an existing principal.

For more detailed examples, please refer to the [Usage Guide](#usage-guide) section.

## Testing

The Safe Forge contract has a comprehensive test suite located in the `/workspace/tests/safe-forge_test.ts` file. The tests cover the following scenarios:

- Admin management (adding, removing, and validating admins)
- Contract template registration and approval
- Successful and failed contract generation
- Error handling for various input validation checks

To run the tests, use the following command:

```
clarinet test
```

The test suite ensures that the Safe Forge contract functions as expected and provides a reliable mechanism for secure contract generation.

## Security Considerations

The Safe Forge contract has been designed with security in mind. Some key security features include:

- **Access Control**: Only authorized administrators can perform sensitive operations, such as managing templates and admins.
- **Input Validation**: The contract thoroughly validates all user inputs to ensure data integrity and prevent malicious contract generation.
- **Audit Logging**: All contract generation activities are recorded in the `generated-contracts` map, providing a comprehensive audit trail.
- **Upgradability**: The contract can be upgraded by the admin team to address potential vulnerabilities or add new features.

Additionally, the contract has been thoroughly tested to ensure its correctness and resilience against common security vulnerabilities.
