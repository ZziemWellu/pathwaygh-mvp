"""
Paystack Payment Integration
Mobile Money, Card, Bank Transfers
"""

import os
import hmac
import hashlib
import json
from typing import Dict, Optional
import httpx
import logging

logger = logging.getLogger(__name__)

# Paystack configuration
PAYSTACK_SECRET_KEY = os.getenv('PAYSTACK_SECRET_KEY', 'sk_test_xxxxxxxxxxxxx')
PAYSTACK_PUBLIC_KEY = os.getenv('PAYSTACK_PUBLIC_KEY', 'pk_test_xxxxxxxxxxxxx')
PAYSTACK_BASE_URL = 'https://api.paystack.co'

# Headers for Paystack API
HEADERS = {
    'Authorization': f'Bearer {PAYSTACK_SECRET_KEY}',
    'Content-Type': 'application/json',
}


class PaystackService:
    """Paystack payment integration service"""
    
    @staticmethod
    async def initialize_transaction(
        email: str,
        amount: int,  # in pesewas (GHS * 100)
        reference: str,
        metadata: Optional[Dict] = None
    ) -> Dict:
        """Initialize a Paystack transaction"""
        url = f"{PAYSTACK_BASE_URL}/transaction/initialize"
        
        payload = {
            "email": email,
            "amount": amount,
            "reference": reference,
            "callback_url": "https://pathway.ai/payment/callback",
            "metadata": metadata or {}
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=HEADERS)
            return response.json()
    
    @staticmethod
    async def verify_transaction(reference: str) -> Dict:
        """Verify a Paystack transaction"""
        url = f"{PAYSTACK_BASE_URL}/transaction/verify/{reference}"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=HEADERS)
            return response.json()
    
    @staticmethod
    async def list_plans() -> Dict:
        """List available subscription plans"""
        url = f"{PAYSTACK_BASE_URL}/plan"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=HEADERS)
            return response.json()
    
    @staticmethod
    async def create_plan(
        name: str,
        amount: int,  # in pesewas
        interval: str,  # daily, weekly, monthly, yearly
        description: str = ""
    ) -> Dict:
        """Create a subscription plan"""
        url = f"{PAYSTACK_BASE_URL}/plan"
        
        payload = {
            "name": name,
            "amount": amount,
            "interval": interval,
            "description": description
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=HEADERS)
            return response.json()
    
    @staticmethod
    def verify_webhook_signature(
        payload: str,
        signature: str,
        secret_key: str = PAYSTACK_SECRET_KEY
    ) -> bool:
        """Verify Paystack webhook signature"""
        expected_signature = hmac.new(
            secret_key.encode('utf-8'),
            payload.encode('utf-8'),
            hashlib.sha512
        ).hexdigest()
        
        return hmac.compare_digest(signature, expected_signature)
    
    @staticmethod
    async def create_subscription(
        email: str,
        plan_code: str,
        authorization_code: Optional[str] = None
    ) -> Dict:
        """Create a subscription"""
        url = f"{PAYSTACK_BASE_URL}/subscription"
        
        payload = {
            "customer": email,
            "plan": plan_code,
            "authorization": authorization_code
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=HEADERS)
            return response.json()
    
    @staticmethod
    async def get_transaction_history(
        page: int = 1,
        per_page: int = 10
    ) -> Dict:
        """Get transaction history"""
        url = f"{PAYSTACK_BASE_URL}/transaction"
        params = {"page": page, "perPage": per_page}
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params, headers=HEADERS)
            return response.json()


# Payment plans
SUBSCRIPTION_PLANS = {
    'free': {'amount': 0, 'interval': 'monthly', 'label': 'Free'},
    'basic': {'amount': 5000, 'interval': 'monthly', 'label': 'Basic - GH₵ 50'},
    'premium': {'amount': 12000, 'interval': 'monthly', 'label': 'Premium - GH₵ 120'},
    'school': {'amount': 50000, 'interval': 'monthly', 'label': 'School - GH₵ 500'},
}

paystack = PaystackService()
