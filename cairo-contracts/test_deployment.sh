#!/bin/bash

# ZKGameVault Deployment Test Script - ZK Proof Version
# Tests the deployed contracts with zero-knowledge proofs

set -e

echo "🧪 Testing ZKGameVault deployment with ZK Proofs..."

# Check if environment variables are set
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Please create it with your wallet configuration."
    exit 1
fi

# Load environment variables
source .env

# Set up Scarb path
export PATH="/home/abhip05/.local/share/mise/installs/scarb/2.12.2/bin:$PATH"

# Test 1: Create Identity with ZK Proof
echo "📝 Test 1: Creating identity with Pedersen commitment..."
USER_ID=12345
AGE=25
COUNTRY=1

# Generate a salt (in production, this would be cryptographically random)
# For testing, we use a fixed salt
SALT=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef

# Compute Pedersen commitment using Python helper
echo "Computing Pedersen commitment for age $AGE with salt $SALT..."

# Compute commitment using Python from virtual environment
if [ -d "venv" ]; then
    source venv/bin/activate
    echo "✅ Virtual environment activated"
fi

if [ -f "compute_commitment.py" ]; then
    echo "Computing Pedersen hash using Python from venv..."
    AGE_COMMITMENT=$(python compute_commitment.py $AGE $SALT)

    if [ $? -eq 0 ] && [ ! -z "$AGE_COMMITMENT" ]; then
        echo "✅ Computed commitment: $AGE_COMMITMENT"
    else
        echo "❌ Python computation failed"
        echo "Make sure cairo-lang is installed in venv: pip install cairo-lang"
        exit 1
    fi
else
    echo "❌ compute_commitment.py not found"
    exit 1
fi

# Create identity with commitment
echo "Creating identity for user $USER_ID with age commitment (actual age: $AGE, country: $COUNTRY)"
sozo execute dojo_starter-identity_vault create_identity $USER_ID $AGE_COMMITMENT $COUNTRY --wait

if [ $? -eq 0 ]; then
    echo "✅ Identity created successfully with ZK commitment"
else
    echo "❌ Identity creation failed"
    exit 1
fi

# Test 2: Verify Age with ZK Proof
echo "🔍 Test 2: Verifying age with zero-knowledge proof..."
MIN_AGE=18

echo "Verifying age >= $MIN_AGE for user $USER_ID (providing proof with age=$AGE and salt=$SALT)"
sozo execute dojo_starter-identity_vault verify_age $USER_ID $MIN_AGE $AGE $SALT --wait

if [ $? -eq 0 ]; then
    echo "✅ Age verification completed with valid ZK proof"
else
    echo "❌ Age verification failed"
    exit 1
fi

# Test 3: Create Game
echo "🎮 Test 3: Creating Tic-Tac-Toe game..."
GAME_ID=1
GAME_MIN_AGE=18

echo "Creating game $GAME_ID with minimum age requirement $GAME_MIN_AGE"
sozo execute dojo_starter-tictactoe create_game $GAME_ID $GAME_MIN_AGE --wait

if [ $? -eq 0 ]; then
    echo "✅ Game created successfully"
else
    echo "❌ Game creation failed"
    exit 1
fi

# Test 4: Join Game
echo "👥 Test 4: Joining game..."
echo "User $USER_ID joining game $GAME_ID"
sozo execute dojo_starter-tictactoe join_game $GAME_ID $USER_ID --wait

if [ $? -eq 0 ]; then
    echo "✅ Game joined successfully"
else
    echo "❌ Game join failed"
    exit 1
fi

# Test 5: Make Move
echo "🎯 Test 5: Making move..."
POSITION=5

echo "Making move at position $POSITION"
sozo execute dojo_starter-tictactoe make_move $GAME_ID $POSITION $USER_ID --wait

if [ $? -eq 0 ]; then
    echo "✅ Move completed successfully"
else
    echo "❌ Move failed"
    exit 1
fi

echo ""
echo "🎉 All tests passed successfully!"
echo ""
echo "📊 Test Summary:"
echo "  ✅ Identity Creation"
echo "  ✅ Age Verification"
echo "  ✅ Game Creation"
echo "  ✅ Game Join"
echo "  ✅ Move Making"
echo ""
echo "🌍 Check your transactions on: https://sepolia.starkscan.io/"
echo ""
echo "🎯 Next Steps:"
echo "1. Try creating multiple identities with different ages"
echo "2. Test age restriction enforcement"
echo "3. Build a frontend interface"
echo "4. Implement full ZK-STARK proofs"