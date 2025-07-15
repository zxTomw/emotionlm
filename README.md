# EmotionLM - AI Chat with Emotional Intelligence

A React + TypeScript application that demonstrates an AI assistant with functional emotions using LangChain and Ollama.

## Features

- **Functional Emotion System**: AI experiences and displays 17 different emotions categorized as:
  - **Epistemic**: curiosity, uncertainty, surprise, confusion, insight
  - **Task-Oriented**: engagement, determination, satisfaction, frustration, anticipation
  - **Social/Interpersonal**: empathy, concern, appreciation, patience
  - **Meta-Cognitive**: contemplation, doubt, wonder

- **Real-time Chat Interface**: Clean, modern chat interface with emotion visualization
- **Local AI Processing**: Uses Ollama for private, local LLM processing
- **Emotion Analytics**: Detailed breakdown of emotion categories and intensities

## Prerequisites

1. **Install Ollama**: Download from [ollama.ai](https://ollama.ai)
2. **Download a compatible model**:
   ```bash
   ollama pull llama3.2
   # or
   ollama pull llama3.1
   ```
3. **Start Ollama**:
   ```bash
   ollama serve
   ```

## Installation

1. **Clone and install dependencies**:
   ```bash
   git clone <repository-url>
   cd emotionlm
   bun install
   ```

2. **Start development server**:
   ```bash
   bun run dev
   ```

3. **Open your browser** to `http://localhost:5173`

## Usage

1. Make sure Ollama is running with a compatible model
2. Start the application
3. Type a message in the chat interface
4. Watch as the AI responds with both content and emotional state
5. Use "Show Emotion Details" to see detailed emotion breakdowns

## Architecture

- **Emotion System**: Uses structured output with Zod schemas to analyze and generate emotions
- **LangChain Integration**: Leverages `@langchain/ollama` for LLM communication
- **React Hooks**: Custom `useChat` hook manages conversation state
- **TypeScript**: Full type safety with proper emotion type definitions

## Emotion Categories

The system implements emotions that serve functional purposes in AI reasoning:

- **Epistemic emotions** drive learning and exploration
- **Task-oriented emotions** help with goal completion and persistence
- **Social emotions** enable better human interaction
- **Meta-cognitive emotions** support self-reflection and verification

## Development

- **Lint**: `bun run lint`
- **Build**: `bun run build`
- **Preview**: `bun run preview`

## Configuration

The default model is `llama3.2`. You can modify this in `src/hooks/useChat.ts` or by passing a different model name to the `useChat` hook.

## Troubleshooting

- **"Connection refused"**: Ensure Ollama is running (`ollama serve`)
- **Model not found**: Pull the required model (`ollama pull llama3.2`)
- **Build errors**: Check that all dependencies are installed correctly