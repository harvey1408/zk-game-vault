#!/bin/bash

# ZKGameVault Deployment Script for StarkNet Sepolia Testnet
# This script deploys the Dojo world with identity vault and Tic-Tac-Toe game

set -e

echo "🚀 Starting ZKGameVault deployment to StarkNet Sepolia Testnet..."

# Check if environment variables are set
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Please create it with your wallet configuration."
    exit 1
fi

# Load environment variables
source .env

# Check required variables
if [ -z "$DOJO_ACCOUNT_ADDRESS" ] || [ -z "$DOJO_PRIVATE_KEY" ]; then
    echo "❌ DOJO_ACCOUNT_ADDRESS and DOJO_PRIVATE_KEY must be set in .env file"
    exit 1
fi

# Set up Scarb path
export PATH="/home/abhip05/.local/share/mise/installs/scarb/2.12.2/bin:$PATH"

echo "📦 Building contracts..."
sozo build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build successful"

echo "🌍 Using existing Dojo world..."
# Skip initialization since we already have a Dojo project
echo "✅ Dojo world is ready"

echo "📋 Deploying models and systems..."
# Migrate the world (this will deploy all models and systems)
sozo migrate

if [ $? -ne 0 ]; then
    echo "❌ Migration failed"
    exit 1
fi

echo "✅ Migration successful"

echo "🎯 Getting deployed contract addresses..."
# Get the world address from the manifest
WORLD_ADDRESS=$(grep -o '"address": "0x[^"]*"' manifest_dev.json | head -1 | cut -d'"' -f4)
echo "🌍 World Address: $WORLD_ADDRESS"

echo ""
echo "🔐 Granting writer permissions to contracts..."

# Grant writer permissions for identity_vault system
echo "Granting permissions to identity_vault..."
sozo auth grant writer dojo_starter-Identity,dojo_starter-identity_vault --world $WORLD_ADDRESS --wait
sozo auth grant writer dojo_starter-AgeVerification,dojo_starter-identity_vault --world $WORLD_ADDRESS --wait
sozo auth grant writer dojo_starter-IdentityCreated,dojo_starter-identity_vault --world $WORLD_ADDRESS --wait
sozo auth grant writer dojo_starter-AgeVerified,dojo_starter-identity_vault --world $WORLD_ADDRESS --wait

# Grant writer permissions for stark_age_verifier system
echo "Granting permissions to stark_age_verifier..."
sozo auth grant writer dojo_starter-VerificationFact,dojo_starter-stark_age_verifier --world $WORLD_ADDRESS --wait
sozo auth grant writer dojo_starter-VerificationToken,dojo_starter-stark_age_verifier --world $WORLD_ADDRESS --wait
sozo auth grant writer dojo_starter-FactRegistered,dojo_starter-stark_age_verifier --world $WORLD_ADDRESS --wait
sozo auth grant writer dojo_starter-ProofVerified,dojo_starter-stark_age_verifier --world $WORLD_ADDRESS --wait

# Grant writer permissions for tictactoe system
echo "Granting permissions to tictactoe..."
sozo auth grant writer dojo_starter-TicTacToeGame,dojo_starter-tictactoe --world $WORLD_ADDRESS --wait
sozo auth grant writer dojo_starter-GameMove,dojo_starter-tictactoe --world $WORLD_ADDRESS --wait
sozo auth grant writer dojo_starter-GameCreated,dojo_starter-tictactoe --world $WORLD_ADDRESS --wait
sozo auth grant writer dojo_starter-GameJoined,dojo_starter-tictactoe --world $WORLD_ADDRESS --wait
sozo auth grant writer dojo_starter-MoveMade,dojo_starter-tictactoe --world $WORLD_ADDRESS --wait

# Grant writer permissions for actions system (Position, Moves)
echo "Granting permissions to actions..."
sozo auth grant writer dojo_starter-Position,dojo_starter-actions --world $WORLD_ADDRESS --wait
sozo auth grant writer dojo_starter-Moves,dojo_starter-actions --world $WORLD_ADDRESS --wait
sozo auth grant writer dojo_starter-DirectionsAvailable,dojo_starter-actions --world $WORLD_ADDRESS --wait

echo "✅ Permissions granted"
echo ""

echo "🔗 Setting STARK verifier address in tictactoe contract..."
# Get the STARK verifier address from manifest
VERIFIER_ADDRESS=$(grep -A 5 "stark_age_verifier" manifest_dev.json | grep "address" | head -1 | cut -d'"' -f4)

if [ -z "$VERIFIER_ADDRESS" ]; then
    echo "❌ Could not find stark_age_verifier address in manifest"
else
    echo "STARK Verifier Address: $VERIFIER_ADDRESS"
    # Set verifier in tictactoe contract
    sozo execute dojo_starter-tictactoe set_verifier $VERIFIER_ADDRESS --world $WORLD_ADDRESS --wait
    echo "✅ Verifier address set in tictactoe contract"
fi

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "📝 Next Steps:"
echo "1. Fund your account with testnet ETH from: https://faucet.sepolia.starknet.io/"
echo "2. Clear browser localStorage and create a fresh identity"
echo "3. Test the TRUE zero-knowledge proof flow!"
echo ""
echo "🌍 World Address: $WORLD_ADDRESS"
echo "🔍 STARK Verifier: $VERIFIER_ADDRESS"
echo "🔍 Explorer: https://sepolia.starkscan.io/"