async function testLocalApi() {
  try {
    const res = await fetch('http://localhost:3000/api/surveys');
    const json = await res.json();
    console.log('Total surveys:', json.data.length);
    
    // Find a survey with prb
    const withPrb = json.data.find(r => r.prb && Object.keys(r.prb).length > 0);
    if (withPrb) {
      console.log('Found PRB data in respondent:', withPrb.nama_responden);
      console.log(JSON.stringify(withPrb.prb, null, 2));
      console.log('Type of PRB is:', typeof withPrb.prb);
    } else {
      console.log('No survey found with PRB data.');
    }
  } catch (err) {
    console.error('Local API error:', err);
  }
}

testLocalApi();
