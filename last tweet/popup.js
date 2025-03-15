document.addEventListener('DOMContentLoaded', async () => {
  const tweetContainer = document.getElementById('tweet-container');
  const loadingElement = document.getElementById('loading');
  const errorElement = document.getElementById('error');
  const tweetText = document.getElementById('tweet-text');
  const tweetDate = document.getElementById('tweet-date');
  const tweetLink = document.getElementById('tweet-link');

  async function fetchLatestContent() {
    try {
      // Using HN Algolia API to search for Karpathy's content
      const response = await fetch(
        'https://hn.algolia.com/api/v1/search?query=karpathy&restrictSearchableAttributes=author,url,title&numericFilters=created_at_i>0'
      );

      if (!response.ok) {
        throw new Error('Failed to fetch content');
      }

      const data = await response.json();
      
      if (!data || !data.hits || data.hits.length === 0) {
        throw new Error('No content found');
      }

      // Filter for Twitter/X URLs and sort by date
      const tweets = data.hits
        .filter(hit => hit.url && (
          hit.url.includes('twitter.com/karpathy') || 
          hit.url.includes('x.com/karpathy')
        ))
        .sort((a, b) => b.created_at_i - a.created_at_i);

      if (tweets.length === 0) {
        throw new Error('No tweets found');
      }

      const latestTweet = tweets[0];
      const date = new Date(latestTweet.created_at_i * 1000);

      // Clean up the text
      const title = latestTweet.title.replace(/^Karpathy: /, '');

      // Convert any Twitter URL to X.com
      const tweetUrl = latestTweet.url.replace('twitter.com', 'x.com');

      // Update UI
      tweetText.textContent = title;
      tweetDate.textContent = date.toLocaleDateString();
      tweetLink.href = tweetUrl;
      
      loadingElement.style.display = 'none';
      errorElement.style.display = 'none';
      tweetContainer.style.display = 'block';

    } catch (error) {
      console.error('Error fetching content:', error);
      
      // Try Firebase HN API as fallback
      try {
        const topStoriesResponse = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
        if (!topStoriesResponse.ok) {
          throw new Error('Failed to fetch top stories');
        }

        const storyIds = await topStoriesResponse.json();
        let latestKarpathyTweet = null;

        // Check the first 100 stories
        for (let i = 0; i < Math.min(100, storyIds.length); i++) {
          const storyResponse = await fetch(`https://hacker-news.firebaseio.com/v0/item/${storyIds[i]}.json`);
          if (!storyResponse.ok) continue;

          const story = await storyResponse.json();
          if (story.url && (
            story.url.includes('twitter.com/karpathy') || 
            story.url.includes('x.com/karpathy')
          )) {
            latestKarpathyTweet = story;
            break;
          }
        }

        if (!latestKarpathyTweet) {
          throw new Error('No tweets found in top stories');
        }

        const date = new Date(latestKarpathyTweet.time * 1000);
        const tweetUrl = latestKarpathyTweet.url.replace('twitter.com', 'x.com');

        // Update UI
        tweetText.textContent = latestKarpathyTweet.title;
        tweetDate.textContent = date.toLocaleDateString();
        tweetLink.href = tweetUrl;
        
        loadingElement.style.display = 'none';
        errorElement.style.display = 'none';
        tweetContainer.style.display = 'block';

      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
        loadingElement.style.display = 'none';
        tweetContainer.style.display = 'none';
        errorElement.style.display = 'block';
        errorElement.textContent = 'Unable to fetch latest content. Please try again later.';
      }
    }
  }

  // Retry mechanism
  const retryButton = document.createElement('button');
  retryButton.textContent = 'Retry';
  retryButton.style.marginTop = '10px';
  retryButton.onclick = fetchLatestContent;
  errorElement.appendChild(retryButton);

  fetchLatestContent();
}); 