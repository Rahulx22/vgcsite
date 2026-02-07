const https = require('https');

https.get('https://panel.vgcadvisors.com/api/v1/pages', (resp) => {
  let data = '';

  resp.on('data', (chunk) => {
    data += chunk;
  });

  resp.on('end', () => {
    try {
      const jsonData = JSON.parse(data);
      const careerPage = jsonData.data.find(page => page.type === 'career' || page.slug === 'career');
      
      if (careerPage) {
        const sectionBlock = careerPage.blocks.find(block => block.type === 'career_section');
        if (sectionBlock && sectionBlock.data && sectionBlock.data.jobs) {
          console.log('Job Roles Analysis:');
          const roles = new Set();
          sectionBlock.data.jobs.forEach(job => {
            if (job.roles) {
              roles.add(job.roles);
            }
            console.log(`Job: ${job.title} - Roles: ${job.roles || 'N/A'}`);
          });
          console.log('\nUnique Roles:', Array.from(roles));
        } else {
          console.log('No career section block or jobs found');
        }
      } else {
        console.log('Career page not found');
      }
    } catch (err) {
      console.log('Error parsing JSON:', err.message);
    }
  });

}).on("error", (err) => {
  console.log("Error: " + err.message);
});