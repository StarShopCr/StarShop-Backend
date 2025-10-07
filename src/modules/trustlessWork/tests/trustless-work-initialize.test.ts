import { NestFactory } from '@nestjs/core';
import { TrustlessWorkService } from '../services/trustless-work.service';
import { AppModule } from '@/app.module';
import { NetworkType } from '../dtos/trustless-work.dto';

async function testTrustlessWork() {
  console.log('🚀 Starting Trustless Work Integration Test...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const trustlessWorkService = app.get(TrustlessWorkService);

  try {
    // 1. Test Health Check
    console.log('1️⃣ Testing Health Check...');
    const isHealthy = await trustlessWorkService.healthCheck();
    console.log(`   Health Status: ${isHealthy ? '✅ Healthy' : '❌ Unhealthy'}\n`);

    // 2. Test API Configuration
    console.log('2️⃣ Testing API Configuration...');
    const config = trustlessWorkService.getApiConfiguration();
    console.log('   Configuration:', config);
    console.log('');

    // 3. Test Single Release Escrow Initialization
    console.log('3️⃣ Testing Single Release Escrow...');
    try {
      const singleReleaseResult = await trustlessWorkService.initializeEscrow({
        type: 'single-release' as any,
        seller_key: 'GA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVSGZ',
        approver: 'GB7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVSGZ',
        receiver: 'GC7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVSGZ',
        dispute_resolver: 'GD7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVSGZ',
        total_amount: '1000',
        asset: 'USDC',
        title: 'Test Single Release Escrow',
        description: 'Testing single release escrow creation from script',
      });
      
      console.log('   ✅ Single Release Success!');
      console.log('   Contract ID:', singleReleaseResult.contract_id);
      console.log('   Has Unsigned XDR:', !!singleReleaseResult.unsigned_xdr);
      console.log('');
    } catch (error) {
      console.log('   ❌ Single Release Failed:', error.message);
      console.log('');
    }

    // 4. Test Multi Release Escrow Initialization
    console.log('4️⃣ Testing Multi Release Escrow...');
    try {
      const multiReleaseResult = await trustlessWorkService.initializeEscrow({
        type: 'multi-release' as any,
        seller_key: 'GA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVSGZ',
        approver: 'GB7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVSGZ',
        receiver: 'GC7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVSGZ',
        dispute_resolver: 'GD7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVSGZ',
        milestones: [
          {
            title: 'Milestone 1',
            description: 'First milestone',
            amount: '500',
          },
          {
            title: 'Milestone 2',
            description: 'Second milestone',
            amount: '500',
          },
        ],
        asset: 'USDC',
        title: 'Test Multi Release Escrow',
        description: 'Testing multi release escrow creation from script',
      });

      console.log('   ✅ Multi Release Success!');
      console.log('   Contract ID:', multiReleaseResult.contract_id);
      console.log('   Has Unsigned XDR:', !!multiReleaseResult.unsigned_xdr);
      console.log('');
    } catch (error) {
      console.log('   ❌ Multi Release Failed:', error.message);
      console.log('');
    }

    // 5. Test Error Cases
    console.log('5️⃣ Testing Error Cases...');
    try {
      await trustlessWorkService.initializeEscrow({
        type: 'single-release' as any,
        seller_key: 'INVALID_KEY',
        approver: 'GB7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVSGZ',
        receiver: 'GC7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVSGZ',
        dispute_resolver: 'GD7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVSGZ',
        total_amount: '1000',
        asset: 'USDC',
        title: 'Test Escrow',
        description: 'Test Description',
      });
      console.log('   ❌ Should have failed with invalid key');
    } catch (error) {
      console.log('   ✅ Correctly caught error:', error.message);
    }

    console.log('\n🎉 Trustless Work Integration Test Complete!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await app.close();
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  testTrustlessWork().catch(console.error);
}

export { testTrustlessWork };