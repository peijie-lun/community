# LINE Webhook 配置指南

## 环境变量配置已完成，接下来做什么？

既然您已经在 Vercel 控制台成功配置了环境变量，接下来需要完成以下步骤，确保您的 LINE Bot 能够正常接收和响应消息：

## 步骤 1：完成 Vercel 部署

1. 将您的代码推送到连接到 Vercel 的代码仓库（如 GitHub、GitLab 或 Bitbucket）
2. Vercel 会自动检测代码变更并开始部署过程
3. 等待部署完成，确保没有部署错误

## 步骤 2：获取 Vercel 部署的 URL

1. 部署成功后，Vercel 会为您的项目提供一个唯一的 URL
2. 这个 URL 通常格式为：`https://your-project-name.vercel.app`
3. 您可以在 Vercel 控制台的 **Overview**（概览）标签页中找到这个 URL

## 步骤 3：在 LINE Developer Console 中配置 Webhook

1. 访问 [LINE Developer Console](https://developers.line.biz/console/)
2. 登录您的 LINE 开发者账号
3. 在控制台中找到并点击您的 Bot 项目
4. 在左侧菜单中选择 **Messaging API** 选项卡
5. 向下滚动到 **Webhook settings**（Webhook 设置）部分

### 关键配置：

1. **Webhook URL**：
   - 在输入框中填入您的 Vercel 部署 URL，**并添加 `/api/webhook` 后缀**
   - 例如：`https://your-project-name.vercel.app/api/webhook`

2. **Use webhook**：
   - 点击旁边的开关，将其设置为 **启用** 状态

3. **Verify**（验证）：
   - 点击 **Verify** 按钮验证 Webhook 连接是否正常
   - 如果验证成功，会显示绿色的成功提示
   - 如果验证失败，请检查 URL 是否正确，以及 Vercel 部署是否正常

## 步骤 4：测试您的 Bot

1. 在 LINE Developer Console 的 **Messaging API** 选项卡中找到 **QR code**（二维码）
2. 使用 LINE 应用扫描这个二维码，添加您的 Bot 为好友
3. 向 Bot 发送一条测试消息
4. 检查 Bot 是否能够正确响应
5. 您可以在 Vercel 控制台的 **Logs**（日志）标签页中查看 webhook 的请求和响应记录

## 常见问题排查

如果您的 Bot 没有正常响应，请检查以下几点：

1. **环境变量配置**：
   - 确认在 Vercel 控制台中正确配置了 `LINE_CHANNEL_ACCESS_TOKEN` 和 `LINE_CHANNEL_SECRET`
   - 确保这些值与 LINE Developer Console 中提供的凭证完全一致

2. **Webhook URL 配置**：
   - 确认 URL 格式正确，包含 `/api/webhook` 后缀
   - 尝试在浏览器中访问这个 URL，应该返回 `Method Not Allowed` 错误（这是正常的，因为 webhook 只接受 POST 请求）

3. **Vercel 部署状态**：
   - 检查 Vercel 控制台中的部署状态，确保没有错误
   - 查看部署日志，排查可能的问题

4. **LINE Bot 权限**：
   - 在 LINE Developer Console 中确认您的 Bot 有发送消息的权限
   - 检查是否设置了正确的消息回复权限

完成以上步骤后，您的 LINE Bot 应该能够在 Vercel 平台上正常运行并响应用户消息了！如果您遇到任何问题，请随时参考 Vercel 和 LINE 开发者文档，或查看相关错误日志进行排查。