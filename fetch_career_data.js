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
        if (sectionBlock) {
          console.log('Career Section Jobs:');
          if (sectionBlock.data && sectionBlock.data.jobs) {
            sectionBlock.data.jobs.forEach(job => {
              console.log(`\nJob: ${job.title}`);
              console.log(`ID: ${job.id}`);
              console.log(`PDF URL in API: ${job.job_description_doc}`);
              
              // Try different URL patterns
              const baseUrl = 'https://panel.vgcadvisors.com';
              const patterns = [
                `${baseUrl}/${job.job_description_doc}`,
                `${baseUrl}/storage/${job.job_description_doc}`,
                `${baseUrl}/uploads/${job.job_description_doc}`,
                `${baseUrl}/files/${job.job_description_doc}`
              ];
              
              console.log('Trying URL patterns:');
              patterns.forEach((pattern, index) => {
                console.log(`  ${index + 1}. ${pattern}`);
              });
            });
          }
        }
      }
    } catch (err) {
      console.log('Error parsing JSON:', err.message);
    }
  });

}).on("error", (err) => {
  console.log("Error: " + err.message);
});