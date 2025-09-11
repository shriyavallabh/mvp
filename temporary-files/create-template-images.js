const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const imageTemplates = [
    {
        name: 'tax_saving_opportunity',
        title: 'Tax Saving Alert',
        subtitle: 'Maximize Your Savings',
        content: 'Save up to ₹1,95,000',
        footer: 'Deadline: March 31, 2024',
        bgColor: '#1a365d',
        accentColor: '#f59e0b'
    },
    {
        name: 'investment_update',
        title: 'Investment Update',
        subtitle: 'Portfolio Performance',
        content: 'Returns: +12.5% YTD',
        footer: 'Review Your Portfolio',
        bgColor: '#065f46',
        accentColor: '#10b981'
    },
    {
        name: 'market_insights',
        title: 'Market Insights',
        subtitle: 'Weekly Analysis',
        content: 'Nifty Target: 22,500',
        footer: 'Expert Recommendations',
        bgColor: '#7c2d12',
        accentColor: '#fb923c'
    },
    {
        name: 'financial_planning',
        title: 'Financial Planning',
        subtitle: 'Retirement Goals',
        content: 'Corpus: ₹5 Crore',
        footer: 'Start Early, Retire Happy',
        bgColor: '#581c87',
        accentColor: '#a78bfa'
    },
    {
        name: 'insurance_reminder',
        title: 'Insurance Review',
        subtitle: 'Policy Update',
        content: 'Coverage: ₹50 Lakhs',
        footer: 'Protect Your Family',
        bgColor: '#991b1b',
        accentColor: '#f87171'
    }
];

function createImage(template) {
    const width = 1200;
    const height = 628;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, template.bgColor);
    gradient.addColorStop(1, template.bgColor + 'cc');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Pattern overlay
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 2;
    for (let i = 0; i < width; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + 20, height);
        ctx.stroke();
    }
    
    // Main container
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.roundRect(80, 80, width - 160, height - 160, 20);
    ctx.fill();
    
    // Accent bar
    ctx.fillStyle = template.accentColor;
    ctx.fillRect(80, 80, width - 160, 8);
    
    // Title
    ctx.fillStyle = template.bgColor;
    ctx.font = 'bold 72px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(template.title, width / 2, 220);
    
    // Subtitle
    ctx.fillStyle = '#64748b';
    ctx.font = '36px Arial';
    ctx.fillText(template.subtitle, width / 2, 280);
    
    // Content box
    ctx.fillStyle = template.accentColor + '20';
    ctx.roundRect(200, 320, width - 400, 120, 10);
    ctx.fill();
    
    // Content text
    ctx.fillStyle = template.bgColor;
    ctx.font = 'bold 48px Arial';
    ctx.fillText(template.content, width / 2, 395);
    
    // Footer
    ctx.fillStyle = '#64748b';
    ctx.font = '32px Arial';
    ctx.fillText(template.footer, width / 2, 520);
    
    // FinAdvise branding
    ctx.fillStyle = template.accentColor;
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'right';
    ctx.fillText('FinAdvise', width - 100, height - 40);
    
    return canvas;
}

async function generateAllImages() {
    console.log('Generating WhatsApp template images (1200x628)...\n');
    
    const outputDir = path.join(__dirname, 'template-images');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    for (const template of imageTemplates) {
        const canvas = createImage(template);
        const buffer = canvas.toBuffer('image/png');
        const fileName = `${template.name}.png`;
        const filePath = path.join(outputDir, fileName);
        
        fs.writeFileSync(filePath, buffer);
        console.log(`✅ Created: ${fileName} (${buffer.length} bytes)`);
    }
    
    console.log('\n✨ All images generated successfully!');
    console.log(`📁 Location: ${outputDir}`);
}

generateAllImages().catch(console.error);