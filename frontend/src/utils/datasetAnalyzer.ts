export interface DatasetAnalysis {
  taskType: 'classification' | 'regression';
  numClasses?: number;
  numRows: number;
  numFeatures: number;
  targetColumn: string | null;
}

export interface RecommendedConfig {
  metric: string;
  objective: 'maximize' | 'minimize';
  search_budget: number;
  max_features?: number;
}

/**
 * Analyzes a dataset to determine task type and recommend configurations
 */
export async function analyzeDataset(file: File | null, csvData?: string): Promise<DatasetAnalysis | null> {
  if (!file && !csvData) {
    return null;
  }

  try {
    let text: string;
    
    if (csvData) {
      text = csvData;
    } else if (file) {
      text = await file.text();
    } else {
      return null;
    }

    // Parse CSV
    const lines = text.trim().split('\n').filter(line => line.trim().length > 0);
    if (lines.length === 0) {
      return null;
    }

    // Helper function to parse CSV line
    const parseCSVLine = (line: string): string[] => {
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      return values;
    };

    // Parse headers
    const headers = parseCSVLine(lines[0]);
    
    // Find target column (typically 'target', 'label', 'y', or 'class')
    const targetColumnNames = ['target', 'label', 'y', 'class'];
    let targetColumn: string | null = null;
    let targetIndex = -1;
    
    for (const colName of targetColumnNames) {
      const index = headers.findIndex(h => h.toLowerCase() === colName.toLowerCase());
      if (index !== -1) {
        targetColumn = headers[index];
        targetIndex = index;
        break;
      }
    }

    if (targetIndex === -1) {
      // If no standard target column found, assume last column is target
      targetIndex = headers.length - 1;
      targetColumn = headers[targetIndex];
    }

    // Parse all rows to analyze target column
    const rows = lines.slice(1).map(line => parseCSVLine(line));
    const targetValues = rows
      .map(row => row[targetIndex])
      .filter(val => val !== undefined && val !== null && val.trim() !== '');

    if (targetValues.length === 0) {
      return null;
    }

    // Determine if values are numeric
    const numericValues = targetValues.map(v => {
      const num = parseFloat(v);
      return isNaN(num) ? null : num;
    });

    const allNumeric = numericValues.every(v => v !== null);
    const uniqueValues = new Set(targetValues);
    const numUnique = uniqueValues.size;

    // Determine task type
    // Classification if: non-numeric OR (numeric with < 20 unique values)
    const isClassification = !allNumeric || (allNumeric && numUnique < 20);

    const numRows = rows.length;
    const numFeatures = headers.length - 1; // Exclude target column

    return {
      taskType: isClassification ? 'classification' : 'regression',
      numClasses: isClassification ? numUnique : undefined,
      numRows,
      numFeatures,
      targetColumn,
    };
  } catch (error) {
    console.error('Error analyzing dataset:', error);
    return null;
  }
}

/**
 * Generates recommended configuration based on dataset analysis
 */
export function getRecommendedConfig(analysis: DatasetAnalysis | null): RecommendedConfig {
  if (!analysis) {
    // Default fallback
    return {
      metric: 'accuracy',
      objective: 'maximize',
      search_budget: 50,
    };
  }

  const { taskType, numRows, numFeatures, numClasses } = analysis;

  // Determine metric based on task type
  let metric: string;
  let objective: 'maximize' | 'minimize';

  if (taskType === 'classification') {
    if (numClasses === 2) {
      // Binary classification - use F1 for balanced metric
      metric = 'f1';
    } else {
      // Multi-class classification - use accuracy
      metric = 'accuracy';
    }
    objective = 'maximize';
  } else {
    // Regression - use R² score
    metric = 'r2';
    objective = 'maximize';
  }

  // Determine search budget based on dataset size
  let search_budget: number;
  if (numRows < 100) {
    search_budget = 30; // Small dataset - fewer trials
  } else if (numRows < 500) {
    search_budget = 50; // Medium dataset - standard trials
  } else if (numRows < 2000) {
    search_budget = 75; // Large dataset - more trials
  } else {
    search_budget = 100; // Very large dataset - many trials
  }

  // Determine max_features based on number of features
  let max_features: number | undefined;
  if (numFeatures > 20) {
    // For datasets with many features, limit to top 20
    max_features = 20;
  } else if (numFeatures > 10) {
    // For datasets with moderate features, limit to 10
    max_features = 10;
  }
  // For datasets with <= 10 features, don't limit

  return {
    metric,
    objective,
    search_budget,
    max_features,
  };
}





