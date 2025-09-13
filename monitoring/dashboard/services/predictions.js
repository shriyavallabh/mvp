const Database = require('better-sqlite3');
const path = require('path');
const config = require('../config/analytics.config');

class PredictionsService {
  constructor() {
    this.dbPath = path.join(__dirname, '../database/analytics.db');
    this.config = config.predictions;
    this.initDatabase();
  }

  initDatabase() {
    try {
      this.db = new Database(this.dbPath);
      
      // Create predictions tables
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS advisor_risk_scores (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          advisor_id TEXT NOT NULL,
          advisor_name TEXT,
          churn_risk_score REAL,
          risk_level TEXT,
          risk_factors TEXT,
          last_activity_date DATETIME,
          days_inactive INTEGER,
          content_decline_rate REAL,
          engagement_decline_rate REAL,
          predicted_churn_date DATE,
          confidence_score REAL,
          recommendations TEXT,
          calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(advisor_id)
        );
        
        CREATE TABLE IF NOT EXISTS content_fatigue_scores (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          content_type TEXT NOT NULL,
          fatigue_score REAL,
          fatigue_level TEXT,
          avg_engagement_rate REAL,
          engagement_trend TEXT,
          optimal_frequency TEXT,
          last_sent DATETIME,
          recommendations TEXT,
          calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(content_type)
        );
        
        CREATE TABLE IF NOT EXISTS predictions_log (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          prediction_type TEXT,
          prediction_data TEXT,
          accuracy_score REAL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS idx_risk_scores_level ON advisor_risk_scores(risk_level);
        CREATE INDEX IF NOT EXISTS idx_fatigue_scores_level ON content_fatigue_scores(fatigue_level);
      `);
      
      console.log('Predictions database initialized');
    } catch (error) {
      console.error('Failed to initialize predictions database:', error);
    }
  }

  // Calculate advisor churn risk
  calculateAdvisorChurnRisk(advisorData) {
    try {
      const riskFactors = [];
      let riskScore = 0;
      
      // Factor 1: Days inactive (weight from config)
      const lastActivity = advisorData.last_activity_date ? new Date(advisorData.last_activity_date) : null;
      const daysInactive = lastActivity ? 
        Math.floor((Date.now() - lastActivity) / (1000 * 60 * 60 * 24)) : 999;
      
      if (daysInactive > this.config.churnRisk.inactiveDaysThreshold) {
        riskScore += this.config.churnRisk.daysInactiveWeight;
        riskFactors.push(`Inactive for ${this.config.churnRisk.inactiveDaysThreshold}+ days`);
      } else if (daysInactive > 14) {
        riskScore += 25;
        riskFactors.push('Inactive for 14+ days');
      } else if (daysInactive > 7) {
        riskScore += 10;
        riskFactors.push('Inactive for 7+ days');
      }
      
      // Factor 2: Content generation decline (weight from config)
      const contentDeclineRate = this.calculateDeclineRate(
        advisorData.content_history || []
      );
      
      if (contentDeclineRate > 50) {
        riskScore += this.config.churnRisk.contentDeclineWeight;
        riskFactors.push('Significant content decline (>50%)');
      } else if (contentDeclineRate > 25) {
        riskScore += Math.floor(this.config.churnRisk.contentDeclineWeight * 0.67);
        riskFactors.push('Moderate content decline (>25%)');
      } else if (contentDeclineRate > 10) {
        riskScore += 10;
        riskFactors.push('Slight content decline (>10%)');
      }
      
      // Factor 3: Engagement decline (weight from config)
      const engagementDeclineRate = this.calculateDeclineRate(
        advisorData.engagement_history || []
      );
      
      if (engagementDeclineRate > this.config.churnRisk.severeEngagementDecline) {
        riskScore += this.config.churnRisk.engagementDeclineWeight;
        riskFactors.push('Low engagement rates');
      } else if (engagementDeclineRate > this.config.churnRisk.moderateEngagementDecline) {
        riskScore += 10;
        riskFactors.push('Declining engagement');
      }
      
      // Factor 4: Support interactions (10% weight)
      const recentSupportInteractions = advisorData.support_interactions || 0;
      if (recentSupportInteractions > 3) {
        riskScore += 10;
        riskFactors.push('Multiple support issues');
      } else if (recentSupportInteractions > 1) {
        riskScore += 5;
        riskFactors.push('Recent support contact');
      }
      
      // Determine risk level
      let riskLevel;
      if (riskScore >= this.config.churnRisk.criticalRiskThreshold) {
        riskLevel = 'CRITICAL';
      } else if (riskScore >= this.config.churnRisk.highRiskThreshold) {
        riskLevel = 'HIGH';
      } else if (riskScore >= this.config.churnRisk.mediumRiskThreshold) {
        riskLevel = 'MEDIUM';
      } else if (riskScore >= 10) {
        riskLevel = 'LOW';
      } else {
        riskLevel = 'MINIMAL';
      }
      
      // Calculate predicted churn date
      const predictedChurnDays = Math.max(7, Math.floor((100 - riskScore) * 0.9));
      const predictedChurnDate = new Date();
      predictedChurnDate.setDate(predictedChurnDate.getDate() + predictedChurnDays);
      
      // Generate recommendations
      const recommendations = this.generateAdvisorRecommendations(riskLevel, riskFactors);
      
      // Calculate confidence score
      const confidenceScore = this.calculateConfidenceScore(advisorData);
      
      return {
        advisor_id: advisorData.id,
        advisor_name: advisorData.name,
        churn_risk_score: riskScore,
        risk_level: riskLevel,
        risk_factors: riskFactors.join(', '),
        last_activity_date: lastActivity,
        days_inactive: daysInactive,
        content_decline_rate: contentDeclineRate,
        engagement_decline_rate: engagementDeclineRate,
        predicted_churn_date: predictedChurnDate.toISOString().split('T')[0],
        confidence_score: confidenceScore,
        recommendations: recommendations.join('; ')
      };
    } catch (error) {
      console.error('Error calculating churn risk:', error);
      return null;
    }
  }

  // Calculate content fatigue
  calculateContentFatigue(contentType, historyData) {
    try {
      let fatigueScore = 0;
      const fatigueFactors = [];
      
      // Factor 1: Frequency of sending (weight from config)
      const sendFrequency = historyData.send_count || 0;
      const daysSinceStart = historyData.days_active || this.config.defaultHistoryDays;
      const avgFrequency = sendFrequency / daysSinceStart;
      
      if (avgFrequency > 1) {
        fatigueScore += this.config.contentFatigue.frequencyWeight;
        fatigueFactors.push('Over-sending (>1/day)');
      } else if (avgFrequency > this.config.contentFatigue.mediumFrequencyThreshold) {
        fatigueScore += Math.floor(this.config.contentFatigue.frequencyWeight * 0.625);
        fatigueFactors.push('High frequency (>3/week)');
      } else if (avgFrequency > this.config.contentFatigue.lowFrequencyThreshold) {
        fatigueScore += 10;
        fatigueFactors.push('Moderate frequency');
      }
      
      // Factor 2: Engagement trend (35% weight)
      const engagementTrend = this.calculateEngagementTrend(historyData.engagement_history || []);
      
      if (engagementTrend === 'declining') {
        fatigueScore += 35;
        fatigueFactors.push('Declining engagement');
      } else if (engagementTrend === 'stable') {
        fatigueScore += 15;
      }
      
      // Factor 3: Content repetition (weight from config)
      const repetitionRate = historyData.repetition_rate || 0;
      if (repetitionRate > this.config.contentFatigue.highRepetitionThreshold) {
        fatigueScore += 25;
        fatigueFactors.push('High content repetition');
      } else if (repetitionRate > this.config.contentFatigue.mediumRepetitionThreshold) {
        fatigueScore += 15;
        fatigueFactors.push('Some content repetition');
      }
      
      // Determine fatigue level
      let fatigueLevel;
      if (fatigueScore >= 70) {
        fatigueLevel = 'SEVERE';
      } else if (fatigueScore >= this.config.contentFatigue.severeFatigueThreshold) {
        fatigueLevel = 'HIGH';
      } else if (fatigueScore >= this.config.contentFatigue.moderateFatigueThreshold) {
        fatigueLevel = 'MODERATE';
      } else if (fatigueScore >= 10) {
        fatigueLevel = 'LOW';
      } else {
        fatigueLevel = 'MINIMAL';
      }
      
      // Calculate optimal frequency
      const optimalFrequency = this.calculateOptimalFrequency(contentType, engagementTrend, fatigueScore);
      
      // Generate recommendations
      const recommendations = this.generateContentRecommendations(fatigueLevel, fatigueFactors);
      
      return {
        content_type: contentType,
        fatigue_score: fatigueScore,
        fatigue_level: fatigueLevel,
        avg_engagement_rate: historyData.avg_engagement || 0,
        engagement_trend: engagementTrend,
        optimal_frequency: optimalFrequency,
        last_sent: historyData.last_sent || null,
        recommendations: recommendations.join('; ')
      };
    } catch (error) {
      console.error('Error calculating content fatigue:', error);
      return null;
    }
  }

  // Helper: Calculate decline rate
  calculateDeclineRate(history) {
    if (!history || history.length < 2) return 0;
    
    const recent = history.slice(0, Math.ceil(history.length / 2));
    const older = history.slice(Math.ceil(history.length / 2));
    
    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length;
    
    if (olderAvg === 0) return 0;
    return ((olderAvg - recentAvg) / olderAvg) * 100;
  }

  // Helper: Calculate engagement trend
  calculateEngagementTrend(history) {
    if (!history || history.length < 3) return 'insufficient_data';
    
    const recent = history.slice(0, Math.ceil(history.length / 3));
    const middle = history.slice(Math.ceil(history.length / 3), Math.ceil(history.length * 2 / 3));
    const older = history.slice(Math.ceil(history.length * 2 / 3));
    
    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const middleAvg = middle.reduce((sum, val) => sum + val, 0) / middle.length;
    const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length;
    
    if (recentAvg > middleAvg && middleAvg > olderAvg) {
      return 'improving';
    } else if (recentAvg < middleAvg && middleAvg < olderAvg) {
      return 'declining';
    } else {
      return 'stable';
    }
  }

  // Helper: Calculate confidence score
  calculateConfidenceScore(data) {
    let confidence = 50; // Base confidence
    
    // More data points increase confidence
    if (data.content_history && data.content_history.length > 30) confidence += 20;
    else if (data.content_history && data.content_history.length > 14) confidence += 10;
    
    if (data.engagement_history && data.engagement_history.length > 30) confidence += 20;
    else if (data.engagement_history && data.engagement_history.length > 14) confidence += 10;
    
    // Recent activity increases confidence
    const lastActivity = data.last_activity_date ? new Date(data.last_activity_date) : null;
    const daysSinceActivity = lastActivity ? 
      Math.floor((Date.now() - lastActivity) / (1000 * 60 * 60 * 24)) : 999;
    
    if (daysSinceActivity < 7) confidence += 10;
    
    return Math.min(100, confidence);
  }

  // Helper: Calculate optimal frequency
  calculateOptimalFrequency(contentType, engagementTrend, fatigueScore) {
    const baseFrequencies = {
      'daily_update': '1-2 times per week',
      'market_insight': '2-3 times per week',
      'educational': '1-2 times per week',
      'promotional': '1 time per week',
      'seasonal': '1-2 times per month'
    };
    
    let optimal = baseFrequencies[contentType] || '2-3 times per week';
    
    // Adjust based on fatigue
    if (fatigueScore > 70) {
      optimal = '1 time per week';
    } else if (fatigueScore > 50) {
      optimal = '1-2 times per week';
    }
    
    // Adjust based on engagement
    if (engagementTrend === 'improving' && fatigueScore < 30) {
      optimal = '3-4 times per week';
    }
    
    return optimal;
  }

  // Generate advisor recommendations
  generateAdvisorRecommendations(riskLevel, riskFactors) {
    const recommendations = [];
    
    switch (riskLevel) {
      case 'CRITICAL':
        recommendations.push('Immediate intervention required');
        recommendations.push('Schedule personal call within 24 hours');
        recommendations.push('Offer special incentive or support');
        break;
      case 'HIGH':
        recommendations.push('Proactive outreach needed');
        recommendations.push('Send personalized re-engagement campaign');
        recommendations.push('Review and address any support issues');
        break;
      case 'MEDIUM':
        recommendations.push('Monitor closely');
        recommendations.push('Increase engagement touchpoints');
        recommendations.push('Send motivational content');
        break;
      case 'LOW':
        recommendations.push('Continue regular engagement');
        recommendations.push('Maintain current communication cadence');
        break;
      default:
        recommendations.push('No immediate action required');
    }
    
    // Add specific recommendations based on risk factors
    if (riskFactors.includes('Inactive')) {
      recommendations.push('Send re-activation campaign');
    }
    if (riskFactors.includes('content decline')) {
      recommendations.push('Provide content creation assistance');
    }
    if (riskFactors.includes('support issues')) {
      recommendations.push('Follow up on support tickets');
    }
    
    return recommendations;
  }

  // Generate content recommendations
  generateContentRecommendations(fatigueLevel, fatigueFactors) {
    const recommendations = [];
    
    switch (fatigueLevel) {
      case 'SEVERE':
        recommendations.push('Reduce sending frequency immediately');
        recommendations.push('Focus on high-value content only');
        recommendations.push('Implement content variety strategy');
        break;
      case 'HIGH':
        recommendations.push('Decrease frequency by 30%');
        recommendations.push('Diversify content types');
        recommendations.push('A/B test different formats');
        break;
      case 'MODERATE':
        recommendations.push('Monitor engagement closely');
        recommendations.push('Test optimal sending times');
        recommendations.push('Refresh content templates');
        break;
      case 'LOW':
        recommendations.push('Maintain current strategy');
        recommendations.push('Experiment with new content types');
        break;
      default:
        recommendations.push('Content strategy is optimal');
    }
    
    // Add specific recommendations
    if (fatigueFactors.includes('repetition')) {
      recommendations.push('Create new content variations');
    }
    if (fatigueFactors.includes('Over-sending')) {
      recommendations.push('Implement frequency capping');
    }
    
    return recommendations;
  }

  // Store prediction results
  storePrediction(type, data) {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO predictions_log (prediction_type, prediction_data, accuracy_score)
        VALUES (?, ?, ?)
      `);
      
      stmt.run(type, JSON.stringify(data), data.confidence_score || 0);
    } catch (error) {
      console.error('Error storing prediction:', error);
    }
  }

  // Get at-risk advisors
  getAtRiskAdvisors(minRiskLevel = 'MEDIUM') {
    try {
      const riskLevels = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'MINIMAL'];
      const minIndex = riskLevels.indexOf(minRiskLevel);
      const relevantLevels = riskLevels.slice(0, minIndex + 1);
      
      const placeholders = relevantLevels.map(() => '?').join(',');
      const query = `
        SELECT * FROM advisor_risk_scores 
        WHERE risk_level IN (${placeholders})
        ORDER BY churn_risk_score DESC
      `;
      
      const stmt = this.db.prepare(query);
      return stmt.all(...relevantLevels);
    } catch (error) {
      console.error('Error fetching at-risk advisors:', error);
      return [];
    }
  }

  // Get content fatigue analysis
  getContentFatigueAnalysis() {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM content_fatigue_scores
        ORDER BY fatigue_score DESC
      `);
      
      return stmt.all();
    } catch (error) {
      console.error('Error fetching content fatigue:', error);
      return [];
    }
  }

  // Create early warning system
  createEarlyWarningSystem() {
    const warnings = [];
    
    // Check for critical risk advisors
    const criticalAdvisors = this.getAtRiskAdvisors('CRITICAL');
    if (criticalAdvisors.length > 0) {
      warnings.push({
        type: 'CRITICAL',
        category: 'advisor_churn',
        message: `${criticalAdvisors.length} advisors at critical risk of churning`,
        advisors: criticalAdvisors.map(a => ({ id: a.advisor_id, name: a.advisor_name })),
        action_required: 'Immediate intervention needed'
      });
    }
    
    // Check for severe content fatigue
    const severeFatigue = this.db.prepare(`
      SELECT * FROM content_fatigue_scores WHERE fatigue_level = 'SEVERE'
    `).all();
    
    if (severeFatigue.length > 0) {
      warnings.push({
        type: 'HIGH',
        category: 'content_fatigue',
        message: `${severeFatigue.length} content types showing severe fatigue`,
        content_types: severeFatigue.map(c => c.content_type),
        action_required: 'Adjust content strategy immediately'
      });
    }
    
    return warnings;
  }

  // Generate recommendation engine output
  generateOptimalContentStrategy(advisorId) {
    try {
      // Get advisor risk profile
      const riskProfile = this.db.prepare(`
        SELECT * FROM advisor_risk_scores WHERE advisor_id = ?
      `).get(advisorId);
      
      // Get content fatigue data
      const fatigueData = this.db.prepare(`
        SELECT * FROM content_fatigue_scores ORDER BY fatigue_score ASC
      `).all();
      
      // Generate personalized strategy
      const strategy = {
        advisor_id: advisorId,
        risk_level: riskProfile?.risk_level || 'UNKNOWN',
        recommended_content_types: [],
        optimal_frequency: '',
        best_send_times: [],
        avoid_content_types: [],
        personalization_tips: []
      };
      
      // Select best content types based on low fatigue
      strategy.recommended_content_types = fatigueData
        .filter(c => c.fatigue_score < 30)
        .slice(0, 3)
        .map(c => c.content_type);
      
      // Avoid high fatigue content
      strategy.avoid_content_types = fatigueData
        .filter(c => c.fatigue_score > 70)
        .map(c => c.content_type);
      
      // Set frequency based on risk level
      if (riskProfile?.risk_level === 'CRITICAL' || riskProfile?.risk_level === 'HIGH') {
        strategy.optimal_frequency = 'Daily touchpoints with high-value content';
        strategy.personalization_tips.push('Use highly personalized messaging');
        strategy.personalization_tips.push('Include exclusive offers or insights');
      } else {
        strategy.optimal_frequency = '2-3 times per week';
        strategy.personalization_tips.push('Maintain regular engagement');
        strategy.personalization_tips.push('Focus on educational content');
      }
      
      // Suggest optimal send times (placeholder - would use real data)
      strategy.best_send_times = ['9:00 AM', '12:00 PM', '5:00 PM'];
      
      return strategy;
    } catch (error) {
      console.error('Error generating content strategy:', error);
      return null;
    }
  }
}

module.exports = new PredictionsService();