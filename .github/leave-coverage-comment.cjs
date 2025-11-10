module.exports = async (github, context, require, needs) => {
  const coverageDiff = require('coverage-diff')
  const baseCoverage = needs['base-branch'].outputs['code-coverage']
  const headCoverage = needs['head-branch'].outputs['code-coverage']

  const body = `
  ### Code coverage

  ${coverageDiff.diff(JSON.parse(baseCoverage), JSON.parse(headCoverage), { coverageThreshold: 90 }).results}

  <p align="right">
    Generated against ${context.payload.pull_request.head.sha}
    on ${new Date().toLocaleString('en-GB', { dateStyle: 'long', timeStyle: 'long' })}
  </p>
  `.trim()

  const issue_number = context.issue.number
  const owner = context.repo.owner
  const repo = context.repo.repo

  const comments = await github.rest.issues.listComments({
    issue_number,
    owner,
    repo,
  })

  const existingComment = comments.data.find(
    (comment) =>
      comment.body.startsWith('### Code coverage') &&
      comment.user.login === 'github-actions[bot]',
  )

  if (existingComment) {
    console.log('Updating existing comment')
    console.log(existingComment.html_url)

    await github.rest.issues.updateComment({
      comment_id: existingComment.id,
      issue_number,
      owner,
      repo,
      body,
    })
  } else {
    console.log('Creating new comment')

    const newComment = await github.rest.issues.createComment({
      issue_number,
      owner,
      repo,
      body,
    })

    console.log(newComment.html_url)
  }
}
