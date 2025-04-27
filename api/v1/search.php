<?php

/**
 * Search API endpoint.
 * 
 * Provides search functionality for meditation courses.
 */

require_once __DIR__ . '/../config.php';

// Only allow GET requests.
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
  sendErrorResponse('Method not allowed', 405);
}

// Get query parameters.
$query = isset($_GET['q']) ? trim($_GET['q']) : '';
$semantic = isset($_GET['semantic']) ? (bool) $_GET['semantic'] : false;
$fuzzy = isset($_GET['fuzzy']) ? (bool) $_GET['fuzzy'] : true;
$limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 20;
$offset = isset($_GET['offset']) ? (int) $_GET['offset'] : 0;

// Validate query.
if (empty($query)) {
  sendJsonResponse([
    'total' => 0,
    'items' => [],
    'query' => $query,
    'semantic' => $semantic,
    'fuzzy' => $fuzzy,
  ]);
}

// Load courses data.
$courses = loadCoursesData();

// Define semantic relationships.
$semantic_map = [
  // 同义词映射
  '正念' => ['觉知', '专注', '当下', '静心', 'mindfulness'],
  '冥想' => ['打坐', '静坐', '禅修', '静心', 'meditation'],
  '呼吸' => ['呼吸法', '气息', '吸气', '呼气', '呼吸节奏'],
  '专注' => ['集中', '注意力', '专心', '聚焦'],
  '放松' => ['减压', '舒缓', '松弛', '舒眠', '平和'],
  '压力' => ['焦虑', '紧张', '不安', '烦躁'],
  '睡眠' => ['入睡', '失眠', '休息', '舒眠', '助眠'],
  '感恩' => ['幸福', '感谢', '珍惜', '美好'],
  '身体' => ['身心', '躯体', '感受', '觉察'],
  '自我' => ['自己', '内心', '内在', '本我'],
  
  // 概念关系映射
  '入门' => ['基础', '简单', '初级', '学前', '0基础'],
  '进阶' => ['高级', '深入', '资深', '中级', '提升'],
  '短时间' => ['快速', '简短', '7天', '5分钟', '10分钟'],
  '长时间' => ['深度', '完整', '21天', '30天', '进阶'],
  
  // 目的映射
  '减压' => ['压力管理', '放松', '舒缓压力', '平和心境'],
  '睡眠改善' => ['失眠', '睡眠质量', '助眠', '舒眠', '深度睡眠'],
  '专注力提升' => ['注意力', '集中精神', '工作效率', '专注冥想'],
  '情绪平衡' => ['情绪管理', '心情', '平静心灵', '缓解焦虑'],
  '灵性成长' => ['觉醒', '意识拓展', '精神成长', '禅修'],
  '自我成长' => ['接纳自我', '和解', '自我认知', '自我关爱'],
  '幸福感' => ['幸福冥想', '感恩', '快乐', '满足'],
  
  // 课程类型映射
  '基础课程' => ['7天基础冥想', '冥想学前课', '入门必修课'],
  '进阶课程' => ['21天进阶冥想', '8天禅修冥想', '正念静心之旅'],
  '专注系列' => ['7天专注冥想', '专注力冥想', '工作专注力'],
  '睡眠系列' => ['7天舒眠冥想', '睡眠冥想', '助眠冥想'],
  '情绪系列' => ['缓解焦虑', '平和心境', '情绪管理'],
  '音乐辅助' => ['冥想纯音乐', '脑波音乐', '放松音乐']
];

/**
 * Performs a basic search on courses.
 *
 * @param string $query
 *   The search query.
 * @param array $courses
 *   The courses to search.
 * @param bool $fuzzy
 *   Whether to use fuzzy matching.
 *
 * @return array
 *   The search results.
 */
function basicSearch($query, $courses, $fuzzy = true) {
  $results = [];
  
  foreach ($courses as $course) {
    $score = 0;
    $matchTypes = [];
    
    // 精确匹配搜索
    // 搜索标题（最高权重）
    if (mb_stripos($course['title'], $query) !== false) {
      $score += 8;
      $matchTypes[] = '标题匹配';
    }
    
    // 搜索关键词（中等权重）
    if (mb_stripos($course['keywords'], $query) !== false) {
      $score += 5;
      $matchTypes[] = '关键词匹配';
    }
    
    // 搜索描述（最低权重）
    if (mb_stripos($course['description'], $query) !== false) {
      $score += 3;
      $matchTypes[] = '描述匹配';
    }
    
    // 模糊匹配搜索
    if ($fuzzy && $score === 0) {
      // 分词搜索
      $queryWords = preg_split('/\s+|,|，/', mb_strtolower($query));
      
      foreach ($queryWords as $word) {
        if (mb_strlen($word) < 2) continue; // 忽略太短的词
        
        if (mb_stripos($course['title'], $word) !== false) {
          $score += 4; // 标题中的部分匹配
          $matchTypes[] = '标题部分匹配';
        }
        
        if (mb_stripos($course['keywords'], $word) !== false) {
          $score += 2.5; // 关键词中的部分匹配
          $matchTypes[] = '关键词部分匹配';
        }
        
        if (mb_stripos($course['description'], $word) !== false) {
          $score += 1.5; // 描述中的部分匹配
          $matchTypes[] = '描述部分匹配';
        }
      }
    }
    
    if ($score > 0) {
      $course['score'] = $score;
      $course['matchTypes'] = array_values(array_unique($matchTypes)); // 去重
      $results[] = $course;
    }
  }
  
  // 按得分排序
  usort($results, function($a, $b) {
    return $b['score'] <=> $a['score'];
  });
  
  return $results;
}

/**
 * Performs a semantic search on courses.
 *
 * @param string $query
 *   The search query.
 * @param array $courses
 *   The courses to search.
 * @param array $semantic_map
 *   The semantic relationships map.
 * @param bool $fuzzy
 *   Whether to use fuzzy matching.
 *
 * @return array
 *   The search results with expanded terms.
 */
function semanticSearch($query, $courses, $semantic_map, $fuzzy = true) {
  // 首先进行基础搜索
  $basicResults = basicSearch($query, $courses, $fuzzy);
  
  // 语义扩展查询
  $expandedTerms = expandQueryWithSemantics($query, $semantic_map);
  $semanticResults = [];
  $seenIds = array_map(function($item) {
    return $item['id'];
  }, $basicResults);
  
  // 对每个扩展词进行搜索
  foreach ($expandedTerms as $term) {
    if ($term === $query) continue; // 跳过原始查询词
    
    $termResults = basicSearch($term, $courses, false);
    
    foreach ($termResults as $result) {
      if (!in_array($result['id'], $seenIds)) {
        // 降低语义匹配的得分，但保持相对顺序
        $result['score'] = $result['score'] * 0.7;
        $result['matchTypes'] = array_map(function($type) {
          return '语义' . $type;
        }, $result['matchTypes']);
        $result['semanticMatch'] = true;
        $result['matchedTerm'] = $term;
        $semanticResults[] = $result;
        $seenIds[] = $result['id'];
      }
    }
  }
  
  // 合并结果
  $combinedResults = array_merge($basicResults, $semanticResults);
  
  // 按得分排序
  usort($combinedResults, function($a, $b) {
    return $b['score'] <=> $a['score'];
  });
  
  return [
    'results' => $combinedResults,
    'expandedTerms' => $expandedTerms
  ];
}

/**
 * Expands a query with semantic relationships.
 *
 * @param string $query
 *   The search query.
 * @param array $semantic_map
 *   The semantic relationships map.
 *
 * @return array
 *   The expanded query terms.
 */
function expandQueryWithSemantics($query, $semantic_map) {
  $expandedTerms = [$query]; // 始终包含原始查询
  
  // 检查语义映射
  foreach ($semantic_map as $key => $synonyms) {
    // 如果查询包含关键词或关键词包含查询
    if (mb_stripos($query, $key) !== false || mb_stripos($key, $query) !== false) {
      $expandedTerms[] = $key;
      $expandedTerms = array_merge($expandedTerms, $synonyms);
    }
    
    // 检查同义词是否匹配
    foreach ($synonyms as $synonym) {
      if (mb_stripos($query, $synonym) !== false || mb_stripos($synonym, $query) !== false) {
        $expandedTerms[] = $key;
        $expandedTerms = array_merge($expandedTerms, $synonyms);
      }
    }
  }
  
  // 分词处理
  $queryWords = preg_split('/\s+|,|，/', $query);
  foreach ($queryWords as $word) {
    if (mb_strlen($word) < 2) continue; // 忽略太短的词
    
    foreach ($semantic_map as $key => $synonyms) {
      if (mb_stripos($key, $word) !== false || mb_stripos($word, $key) !== false) {
        $expandedTerms[] = $key;
        $expandedTerms = array_merge($expandedTerms, $synonyms);
      }
      
      foreach ($synonyms as $synonym) {
        if (mb_stripos($synonym, $word) !== false || mb_stripos($word, $synonym) !== false) {
          $expandedTerms[] = $key;
          $expandedTerms = array_merge($expandedTerms, $synonyms);
        }
      }
    }
  }
  
  // 去重并返回
  return array_values(array_unique($expandedTerms));
}

// Perform search based on parameters.
if ($semantic) {
  $searchResult = semanticSearch($query, $courses, $semantic_map, $fuzzy);
  $results = $searchResult['results'];
  $expandedTerms = $searchResult['expandedTerms'];
} else {
  $results = basicSearch($query, $courses, $fuzzy);
  $expandedTerms = [$query];
}

// Apply pagination.
$total = count($results);
$results = array_slice($results, $offset, $limit);

// Prepare response.
$response = [
  'total' => $total,
  'items' => $results,
  'query' => $query,
  'semantic' => $semantic,
  'fuzzy' => $fuzzy,
  'limit' => $limit,
  'offset' => $offset,
];

// Add expanded terms for semantic search.
if ($semantic) {
  $response['expandedTerms'] = $expandedTerms;
}

// Send response.
sendJsonResponse($response);
