#!/usr/bin/env node
/**
 * Test script: Google search flow
 * Demonstrates the complete workflow in a single process
 */

const { getController } = require('./browser-controller');
const OutputFormatter = require('./utils/output-formatter');

async function main() {
  try {
    const controller = await getController();

    // 1. Navigate to Google
    console.log('1. Navigating to Google...');
    const navResult = await controller.navigate('https://google.com');
    console.log(`   URL: ${navResult.url}`);

    // 2. Get snapshot to find search box
    console.log('\n2. Getting page snapshot...');
    const tree = await controller.snapshot();
    console.log('   Snapshot (first 500 chars):');
    console.log(tree.substring(0, 500));

    // 3. Find and click search box, then type
    console.log('\n3. Typing search query...');
    // Google's search box is the combobox "Pesquisar" - find it dynamically
    const refs = require('./utils/state-manager').loadRefs();
    const searchRef = Object.entries(refs).find(([key, val]) =>
      val.role === 'combobox' && (val.name?.includes('Pesquisar') || val.name?.includes('Search'))
    );
    const searchBoxRef = searchRef ? searchRef[0] : 'ref5';
    console.log(`   Using ref: ${searchBoxRef}`);
    await controller.type('PRISM biomedical research', searchBoxRef);
    console.log('   Typed: "PRISM biomedical research"');

    // 4. Press Enter to search
    console.log('\n4. Pressing Enter...');
    await controller.pressKey('Enter');

    // 5. Wait for results
    console.log('\n5. Waiting for results...');
    await controller.wait(3000);

    // 6. Take screenshot
    console.log('\n6. Taking screenshot...');
    const screenshot = await controller.screenshot({
      filename: 'google-search-results.png',
      fullPage: false
    });
    console.log(`   Saved: ${screenshot.saved}`);

    // 7. Get page title
    console.log('\n7. Getting page info...');
    const evalResult = await controller.evaluate('document.title');
    console.log(`   Title: ${evalResult.result}`);

    // 8. Close browser
    console.log('\n8. Closing browser...');
    await controller.close();
    console.log('   Done!');

    console.log('\n✅ Test completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

main();
