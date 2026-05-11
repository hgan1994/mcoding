export function renderPromptAttachmentAsText(attachment) {
    switch (attachment.type) {
        case "github_pr": {
            const lines = [`GitHub PR #${attachment.number}: ${attachment.title}`, attachment.url];
            if (attachment.baseRefName) {
                lines.push(`Base: ${attachment.baseRefName}`);
            }
            if (attachment.headRefName) {
                lines.push(`Head: ${attachment.headRefName}`);
            }
            if (attachment.body) {
                lines.push("", attachment.body);
            }
            return lines.join("\n");
        }
        case "github_issue": {
            const lines = [`GitHub Issue #${attachment.number}: ${attachment.title}`, attachment.url];
            if (attachment.body) {
                lines.push("", attachment.body);
            }
            return lines.join("\n");
        }
    }
}
export function findGitHubPrAttachment(attachments) {
    if (!attachments) {
        return null;
    }
    return (attachments.find((attachment) => attachment.type === "github_pr") ?? null);
}
//# sourceMappingURL=prompt-attachments.js.map