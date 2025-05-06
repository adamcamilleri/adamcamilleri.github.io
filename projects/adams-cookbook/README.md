# Adam's Cookbook

A TikTok-inspired recipe website showcasing quick and easy cooking videos.

## Features

- Modern, TikTok-inspired design
- Responsive layout for all devices
- Recipe cards with thumbnails
- Detailed recipe view with video embedding
- Ingredients and instructions lists
- Smooth animations and transitions

## Technologies Used

- HTML5
- CSS3 (with modern features like CSS Grid and Flexbox)
- JavaScript (ES6+)
- Responsive Design
- TikTok Video Embedding

## Setup

1. Clone the repository
2. Open `index.html` in your browser
3. No build process required - it's a simple static website

## Project Structure

```
adams-cookbook/
├── index.html          # Main HTML file
├── styles.css          # CSS styles
├── script.js           # JavaScript functionality
├── images/            # Recipe thumbnails
└── README.md          # This file
```

## Adding New Recipes

To add new recipes, edit the `recipes` array in `script.js`. Each recipe should follow this structure:

```javascript
{
    id: number,
    title: string,
    description: string,
    videoUrl: string,
    thumbnail: string,
    ingredients: string[],
    instructions: string[]
}
```

## License

MIT License 