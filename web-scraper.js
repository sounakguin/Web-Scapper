const axios = require('axios');
const cheerio = require('cheerio');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// Function to fetch and parse web pages
async function fetchWebPage(url) {
    try {
        const { data } = await axios.get(url);
        return cheerio.load(data);
    } catch (error) {
        console.error(`Error fetching URL ${url}:`, error);
        return null;
    }
}

// Function to scrape disease list and their detail URLs
async function scrapeDiseaseList() {
    const baseURL = 'https://www.1mg.com';
    const url = `${baseURL}/all-diseases`;
    const $ = await fetchWebPage(url);
    if (!$) return [];

    let diseases = [];
    $('a[href*="/diseases/"]').each((index, element) => {
        const diseaseName = $(element).text().trim();
        const diseaseURL = `${baseURL}${$(element).attr('href')}`;
        if (diseaseName && diseaseURL) {
            diseases.push({ diseaseName, diseaseURL });
        }
    });

    return diseases;
}

// Function to scrape detailed information about a disease
async function scrapeDiseaseDetails(diseaseURL) {
    const $ = await fetchWebPage(diseaseURL);
    if (!$) return null;

    const data = {};
    data.diseaseName = $('h1').text().trim();
    data.overview = $('h2:contains("Overview")').next('p').text().trim();
    data.keyFacts = $('h2:contains("Key Facts")').next('p').text().trim();
    data.symptoms = $('h2:contains("Symptoms")').next('p').text().trim();
    data.causes = $('h2:contains("Causes")').next('p').text().trim();
    data.types = $('h2:contains("Types")').next('p').text().trim();
    data.riskFactors = $('h2:contains("Risk Factors")').next('p').text().trim();
    data.diagnosis = $('h2:contains("Diagnosis")').next('p').text().trim();
    data.prevention = $('h2:contains("Prevention")').next('p').text().trim();
    data.specialistToVisit = $('h2:contains("Specialist to Visit")').next('p').text().trim();
    data.treatment = $('h2:contains("Treatment")').next('p').text().trim();
    data.homeCare = $('h2:contains("Home-care")').next('p').text().trim();
    data.alternativeTherapies = $('h2:contains("Alternative Therapies")').next('p').text().trim();
    data.livingWith = $('h2:contains("Living With")').next('p').text().trim();

    data.faqs = [];
    $('h2:contains("FAQs")').nextUntil('h2').find('p').each((index, element) => {
        const question = $(element).find('strong').text().trim();
        const answer = $(element).text().replace(question, '').trim();
        if (question && answer) {
            data.faqs.push({ question, answer });
        }
    });

    data.references = [];
    $('h2:contains("References")').next('ul').find('li').each((index, element) => {
        const reference = $(element).find('a').attr('href');
        if (reference) {
            data.references.push(reference);
        }
    });

    return data;
}

// Function to write data to CSV file
async function writeDataToCSV(data, filePath) {
    const csvWriter = createCsvWriter({
        path: filePath,
        header: [
            { id: 'diseaseName', title: 'Disease Name' },
            { id: 'overview', title: 'Overview' },
            { id: 'keyFacts', title: 'Key Facts' },
            { id: 'symptoms', title: 'Symptoms' },
            { id: 'causes', title: 'Causes' },
            { id: 'types', title: 'Types' },
            { id: 'riskFactors', title: 'Risk Factors' },
            { id: 'diagnosis', title: 'Diagnosis' },
            { id: 'prevention', title: 'Prevention' },
            { id: 'specialistToVisit', title: 'Specialist to Visit' },
            { id: 'treatment', title: 'Treatment' },
            { id: 'homeCare', title: 'Home-care' },
            { id: 'alternativeTherapies', title: 'Alternative Therapies' },
            { id: 'livingWith', title: 'Living With' },
            { id: 'faqs', title: 'FAQs' },
            { id: 'references', title: 'References' }
        ]
    });

    try {
        await csvWriter.writeRecords(data);
        console.log('CSV file written successfully');
    } catch (error) {
        console.error('Error writing CSV file:', error);
    }
}

// Main function to run the web scraper
async function main() {
    const diseases = await scrapeDiseaseList();
    let allDiseaseDetails = [];

    for (let i = 0; i < diseases.length; i++) {
        console.log(`Scraping details for: ${diseases[i].diseaseName}`);
        const details = await scrapeDiseaseDetails(diseases[i].diseaseURL);
        if (details) {
            allDiseaseDetails.push(details);
        }
    }

    await writeDataToCSV(allDiseaseDetails, 'diseases.csv');
}

main();
