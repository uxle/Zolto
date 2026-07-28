# Zolto Tutorial: Building an Interactive Document

In this tutorial, you will build a dynamic, self-grading quiz.

## Step 1: Initialization
Run the following in your terminal:
\`\`\`bash
zolto create interactive-quiz
cd interactive-quiz
\`\`\`

## Step 2: Writing the Quiz
Open \`index.zl\` and replace the contents with:
\`\`\`zolto
# Space Exploration Quiz

@quiz "Solar System" {
  @mcq "What is the largest planet in our solar system?" {
    @choice "Earth"
    @correct "Jupiter"
    @choice "Saturn"
  }
}
\`\`\`

## Step 3: Previewing
Run:
\`\`\`bash
zolto preview index.zl
\`\`\`
Your browser will open to display a beautifully rendered, interactive, accessible quiz!
