//#region scripts/lib/official-external-channel-catalog.json
var official_external_channel_catalog_default = { entries: [
	{
		"name": "@wecom/wecom-operator-plugin",
		"description": "Operator WeCom channel plugin by the Tencent WeCom team.",
		"source": "external",
		"kind": "channel",
		"@gabrielvfonseca/operator": {
			"plugin": {
				"id": "wecom-operator-plugin",
				"label": "WeCom"
			},
			"contracts": { "tools": ["wecom_mcp"] },
			"channel": {
				"id": "wecom",
				"label": "WeCom",
				"selectionLabel": "WeCom（企业微信）",
				"detailLabel": "WeCom",
				"docsPath": "/plugins/community#wecom",
				"docsLabel": "wecom",
				"blurb": "Enterprise messaging and documents, scheduling, task tools.",
				"aliases": [
					"qywx",
					"wework",
					"enterprise-wechat"
				],
				"order": 45
			},
			"channelConfigs": { "wecom": {
				"label": "WeCom",
				"description": "Enterprise WeChat conversation channel.",
				"schema": {
					"type": "object",
					"additionalProperties": true
				}
			} },
			"install": {
				"npmSpec": "@wecom/wecom-operator-plugin@2026.5.7",
				"defaultChoice": "npm",
				"expectedIntegrity": "sha512-TCkP9as00WfEhgFWG8YL/rcmaWGIshAki2HQh83nTRccGfVBCoGjrEboTTqq3yDmK9koWTV11zi8u8A4dNtvug=="
			}
		}
	},
	{
		"name": "operator-plugin-yuanbao",
		"description": "Operator Yuanbao channel plugin by the Tencent Yuanbao team.",
		"source": "external",
		"kind": "channel",
		"@gabrielvfonseca/operator": {
			"plugin": {
				"id": "operator-plugin-yuanbao",
				"label": "Yuanbao"
			},
			"contracts": { "tools": [
				"query_group_info",
				"query_session_members",
				"yuanbao_remind"
			] },
			"channel": {
				"id": "yuanbao",
				"label": "Yuanbao",
				"selectionLabel": "Yuanbao (元宝)",
				"detailLabel": "Yuanbao",
				"docsPath": "/plugins/community#yuanbao",
				"docsLabel": "yuanbao",
				"blurb": "Tencent Yuanbao AI assistant conversation channel.",
				"aliases": [
					"yuanbao",
					"yb",
					"tencent-yuanbao",
					"元宝"
				],
				"order": 85
			},
			"channelConfigs": { "yuanbao": {
				"label": "Yuanbao",
				"description": "Tencent Yuanbao AI assistant channel.",
				"schema": {
					"type": "object",
					"additionalProperties": true
				}
			} },
			"install": {
				"npmSpec": "operator-plugin-yuanbao@2.15.0",
				"defaultChoice": "npm",
				"expectedIntegrity": "sha512-3GD+mf3EjTSUTOAREjTHAyp/deXdpgqB+q+xE0b19Qtat4ADhUV1mHDwFkVCRqTCBY5ATFKtKcipoDejqFj/+w=="
			}
		}
	},
	{
		"name": "@tencent-weixin/operator-weixin",
		"description": "Operator Weixin channel plugin by the Tencent Weixin team.",
		"source": "external",
		"kind": "channel",
		"@gabrielvfonseca/operator": {
			"plugin": {
				"id": "operator-weixin",
				"label": "Weixin"
			},
			"channel": {
				"id": "operator-weixin",
				"label": "Weixin",
				"selectionLabel": "Weixin（微信）",
				"detailLabel": "Weixin",
				"docsPath": "/channels/wechat",
				"docsLabel": "weixin",
				"blurb": "Personal WeChat messaging via QR-code login.",
				"aliases": [
					"weixin",
					"wechat",
					"微信"
				],
				"order": 75
			},
			"channelConfigs": { "operator-weixin": {
				"label": "Weixin",
				"description": "Personal WeChat conversation channel.",
				"schema": {
					"type": "object",
					"additionalProperties": true
				}
			} },
			"install": {
				"npmSpec": "@tencent-weixin/operator-weixin@2.4.6",
				"defaultChoice": "npm",
				"expectedIntegrity": "sha512-qw9k3PLTiMWGNjjsknHgcTManH1w4j+Ji1ArWIaYLKCq3aFRsVwcqnPi127bvOoVMJGW4dbyJ8NECEMgoO+iRw==",
				"minHostVersion": ">=2026.5.12"
			}
		}
	},
	{
		"name": "@zalo-platforms/operator-zaloclawbot",
		"description": "Operator Zalo ClawBot channel plugin by the Zalo Platforms team.",
		"source": "external",
		"kind": "channel",
		"@gabrielvfonseca/operator": {
			"plugin": {
				"id": "operator-zaloclawbot",
				"label": "Zalo ClawBot"
			},
			"channel": {
				"id": "operator-zaloclawbot",
				"label": "Zalo ClawBot",
				"selectionLabel": "Zalo ClawBot (QR)",
				"detailLabel": "Zalo ClawBot",
				"docsPath": "/channels/zaloclawbot",
				"docsLabel": "zaloclawbot",
				"blurb": "Personal Zalo assistant bot via QR-code login — owner-bound, no setup.",
				"aliases": ["zaloclawbot", "zalo-clawbot"],
				"order": 82
			},
			"channelConfigs": { "operator-zaloclawbot": {
				"label": "Zalo ClawBot",
				"description": "Personal Zalo assistant — QR-onboarded, owner-bound.",
				"schema": {
					"type": "object",
					"additionalProperties": true
				}
			} },
			"install": {
				"npmSpec": "@zalo-platforms/operator-zaloclawbot@0.1.4",
				"defaultChoice": "npm",
				"expectedIntegrity": "sha512-5IxZriHJYACLLGqkCPPsTP9tas62kXEOFqTFAFMdunAM3SPhIJwVFRp0WvoP/m7L2PX85weD0g8LOtxM93VDYg==",
				"minHostVersion": ">=2026.4.10"
			}
		}
	},
	{
		"name": "@gabrielvfonseca/clickclack",
		"description": "Operator ClickClack channel plugin",
		"source": "official",
		"kind": "channel",
		"@gabrielvfonseca/operator": {
			"channel": {
				"id": "clickclack",
				"label": "ClickClack",
				"selectionLabel": "ClickClack",
				"detailLabel": "ClickClack Bot",
				"docsPath": "/channels/clickclack",
				"docsLabel": "clickclack",
				"blurb": "self-hosted chat via first-class ClickClack bot tokens.",
				"envVars": ["CLICKCLACK_BOT_TOKEN"],
				"systemImage": "bubble.left.and.bubble.right",
				"markdownCapable": true,
				"preferSessionLookupForAnnounceTarget": true,
				"order": 85,
				"commands": {
					"nativeCommandsAutoEnabled": false,
					"nativeSkillsAutoEnabled": false
				}
			},
			"install": {
				"clawhubSpec": "clawhub:@gabrielvfonseca/clickclack",
				"npmSpec": "@gabrielvfonseca/clickclack",
				"defaultChoice": "npm",
				"minHostVersion": ">=2026.6.9",
				"allowInvalidConfigRecovery": true
			}
		}
	},
	{
		"name": "@gabrielvfonseca/discord",
		"description": "Operator Discord channel plugin",
		"source": "official",
		"kind": "channel",
		"@gabrielvfonseca/operator": {
			"channel": {
				"id": "discord",
				"label": "Discord",
				"selectionLabel": "Discord (Bot API)",
				"detailLabel": "Discord Bot",
				"docsPath": "/channels/discord",
				"docsLabel": "discord",
				"blurb": "very well supported right now.",
				"systemImage": "bubble.left.and.bubble.right",
				"markdownCapable": true,
				"preferSessionLookupForAnnounceTarget": true
			},
			"install": {
				"npmSpec": "@gabrielvfonseca/discord",
				"defaultChoice": "npm",
				"minHostVersion": ">=2026.4.10",
				"allowInvalidConfigRecovery": true
			}
		}
	},
	{
		"name": "@gabrielvfonseca/feishu",
		"description": "Operator Feishu/Lark channel plugin",
		"source": "official",
		"kind": "channel",
		"@gabrielvfonseca/operator": {
			"channel": {
				"id": "feishu",
				"label": "Feishu",
				"selectionLabel": "Feishu/Lark (飞书)",
				"docsPath": "/channels/feishu",
				"docsLabel": "feishu",
				"blurb": "飞书/Lark enterprise messaging with doc/wiki/drive tools.",
				"aliases": ["lark"],
				"order": 35,
				"quickstartAllowFrom": true
			},
			"install": {
				"npmSpec": "@gabrielvfonseca/feishu",
				"defaultChoice": "npm",
				"minHostVersion": ">=2026.5.29"
			}
		}
	},
	{
		"name": "@gabrielvfonseca/googlechat",
		"description": "Operator Google Chat channel plugin",
		"source": "official",
		"kind": "channel",
		"@gabrielvfonseca/operator": {
			"channel": {
				"id": "googlechat",
				"label": "Google Chat",
				"selectionLabel": "Google Chat (Chat API)",
				"detailLabel": "Google Chat",
				"docsPath": "/channels/googlechat",
				"docsLabel": "googlechat",
				"blurb": "Google Workspace Chat app with HTTP webhook.",
				"aliases": ["gchat", "google-chat"],
				"order": 55,
				"systemImage": "message.badge",
				"markdownCapable": true,
				"doctorCapabilities": {
					"dmAllowFromMode": "nestedOnly",
					"groupModel": "route",
					"groupAllowFromFallbackToAllowFrom": false,
					"warnOnEmptyGroupSenderAllowlist": false
				},
				"cliAddOptions": [
					{
						"flags": "--webhook-path <path>",
						"description": "Google Chat webhook path"
					},
					{
						"flags": "--webhook-url <url>",
						"description": "Google Chat webhook URL"
					},
					{
						"flags": "--audience-type <type>",
						"description": "Google Chat audience type (app-url|project-number)"
					},
					{
						"flags": "--audience <value>",
						"description": "Google Chat audience value (app URL or project number)"
					}
				]
			},
			"install": {
				"npmSpec": "@gabrielvfonseca/googlechat",
				"defaultChoice": "npm",
				"minHostVersion": ">=2026.4.10"
			}
		}
	},
	{
		"name": "@gabrielvfonseca/irc",
		"description": "Operator IRC channel plugin",
		"source": "official",
		"kind": "channel",
		"@gabrielvfonseca/operator": {
			"channel": {
				"id": "irc",
				"label": "IRC",
				"selectionLabel": "IRC (Server + Nick)",
				"detailLabel": "IRC",
				"docsPath": "/channels/irc",
				"docsLabel": "irc",
				"blurb": "classic IRC networks with DM/channel routing and pairing controls.",
				"aliases": ["internet-relay-chat"],
				"envVars": [
					"IRC_HOST",
					"IRC_PORT",
					"IRC_TLS",
					"IRC_NICK",
					"IRC_USERNAME",
					"IRC_REALNAME",
					"IRC_PASSWORD",
					"IRC_CHANNELS",
					"IRC_NICKSERV_PASSWORD",
					"IRC_NICKSERV_REGISTER_EMAIL"
				],
				"systemImage": "network"
			},
			"install": {
				"clawhubSpec": "clawhub:@gabrielvfonseca/irc",
				"npmSpec": "@gabrielvfonseca/irc",
				"defaultChoice": "npm",
				"minHostVersion": ">=2026.6.9",
				"allowInvalidConfigRecovery": true
			}
		}
	},
	{
		"name": "@gabrielvfonseca/line",
		"description": "Operator LINE channel plugin",
		"source": "official",
		"kind": "channel",
		"@gabrielvfonseca/operator": {
			"channel": {
				"id": "line",
				"label": "LINE",
				"selectionLabel": "LINE (Messaging API)",
				"detailLabel": "LINE Bot",
				"docsPath": "/channels/line",
				"docsLabel": "line",
				"blurb": "LINE Messaging API webhook bot.",
				"systemImage": "message",
				"order": 75,
				"quickstartAllowFrom": true
			},
			"install": {
				"npmSpec": "@gabrielvfonseca/line",
				"defaultChoice": "npm",
				"minHostVersion": ">=2026.4.10"
			}
		}
	},
	{
		"name": "@gabrielvfonseca/mattermost",
		"description": "Operator Mattermost channel plugin",
		"source": "official",
		"kind": "channel",
		"@gabrielvfonseca/operator": {
			"channel": {
				"id": "mattermost",
				"label": "Mattermost",
				"selectionLabel": "Mattermost (plugin)",
				"docsPath": "/channels/mattermost",
				"docsLabel": "mattermost",
				"blurb": "self-hosted Slack-style chat; install the plugin to enable.",
				"envVars": ["MATTERMOST_BOT_TOKEN", "MATTERMOST_URL"],
				"order": 65
			},
			"install": {
				"clawhubSpec": "clawhub:@gabrielvfonseca/mattermost",
				"npmSpec": "@gabrielvfonseca/mattermost",
				"defaultChoice": "npm",
				"minHostVersion": ">=2026.6.9",
				"allowInvalidConfigRecovery": true
			}
		}
	},
	{
		"name": "@gabrielvfonseca/matrix",
		"description": "Operator Matrix channel plugin",
		"source": "official",
		"kind": "channel",
		"@gabrielvfonseca/operator": {
			"channel": {
				"id": "matrix",
				"label": "Matrix",
				"selectionLabel": "Matrix (plugin)",
				"docsPath": "/channels/matrix",
				"docsLabel": "matrix",
				"blurb": "open protocol; install the plugin to enable.",
				"order": 70,
				"markdownCapable": true,
				"quickstartAllowFrom": true,
				"doctorCapabilities": {
					"dmAllowFromMode": "nestedOnly",
					"groupModel": "sender",
					"groupAllowFromFallbackToAllowFrom": false,
					"warnOnEmptyGroupSenderAllowlist": true
				},
				"cliAddOptions": [
					{
						"flags": "--homeserver <url>",
						"description": "Matrix homeserver URL"
					},
					{
						"flags": "--user-id <id>",
						"description": "Matrix user ID"
					},
					{
						"flags": "--access-token <token>",
						"description": "Matrix access token"
					},
					{
						"flags": "--device-name <name>",
						"description": "Matrix device name"
					},
					{
						"flags": "--initial-sync-limit <n>",
						"description": "Matrix initial sync limit"
					}
				]
			},
			"install": {
				"clawhubSpec": "clawhub:@gabrielvfonseca/matrix",
				"npmSpec": "@gabrielvfonseca/matrix",
				"defaultChoice": "clawhub",
				"minHostVersion": ">=2026.4.10",
				"allowInvalidConfigRecovery": true
			}
		}
	},
	{
		"name": "@gabrielvfonseca/msteams",
		"description": "Operator Microsoft Teams channel plugin",
		"source": "official",
		"kind": "channel",
		"@gabrielvfonseca/operator": {
			"channel": {
				"id": "msteams",
				"label": "Microsoft Teams",
				"selectionLabel": "Microsoft Teams (Teams SDK)",
				"docsPath": "/channels/msteams",
				"docsLabel": "msteams",
				"blurb": "Teams SDK; enterprise support.",
				"aliases": ["teams"],
				"order": 60
			},
			"install": {
				"npmSpec": "@gabrielvfonseca/msteams",
				"defaultChoice": "npm",
				"minHostVersion": ">=2026.4.10"
			}
		}
	},
	{
		"name": "@gabrielvfonseca/nextcloud-talk",
		"description": "Operator Nextcloud Talk channel plugin",
		"source": "official",
		"kind": "channel",
		"@gabrielvfonseca/operator": {
			"channel": {
				"id": "nextcloud-talk",
				"label": "Nextcloud Talk",
				"selectionLabel": "Nextcloud Talk (self-hosted)",
				"docsPath": "/channels/nextcloud-talk",
				"docsLabel": "nextcloud-talk",
				"blurb": "Self-hosted chat via Nextcloud Talk webhook bots.",
				"aliases": ["nc-talk", "nc"],
				"order": 65,
				"quickstartAllowFrom": true
			},
			"install": {
				"npmSpec": "@gabrielvfonseca/nextcloud-talk",
				"defaultChoice": "npm",
				"minHostVersion": ">=2026.4.10"
			}
		}
	},
	{
		"name": "@gabrielvfonseca/nostr",
		"description": "Operator Nostr channel plugin for NIP-04 encrypted DMs",
		"source": "official",
		"kind": "channel",
		"@gabrielvfonseca/operator": {
			"channel": {
				"id": "nostr",
				"label": "Nostr",
				"selectionLabel": "Nostr (NIP-04 DMs)",
				"docsPath": "/channels/nostr",
				"docsLabel": "nostr",
				"blurb": "Decentralized protocol; encrypted DMs via NIP-04.",
				"order": 55,
				"quickstartAllowFrom": true
			},
			"install": {
				"npmSpec": "@gabrielvfonseca/nostr",
				"defaultChoice": "npm",
				"minHostVersion": ">=2026.4.10"
			}
		}
	},
	{
		"name": "@gabrielvfonseca/qqbot",
		"description": "Operator QQ Bot channel plugin",
		"source": "official",
		"kind": "channel",
		"@gabrielvfonseca/operator": {
			"channel": {
				"id": "qqbot",
				"label": "QQ Bot",
				"selectionLabel": "QQ Bot (Official API)",
				"detailLabel": "QQ Bot",
				"docsPath": "/channels/qqbot",
				"docsLabel": "qqbot",
				"blurb": "connect to QQ via official QQ Bot API with group chat and direct message support.",
				"systemImage": "bubble.left.and.bubble.right"
			},
			"install": {
				"npmSpec": "@gabrielvfonseca/qqbot",
				"defaultChoice": "npm",
				"minHostVersion": ">=2026.4.10"
			}
		}
	},
	{
		"name": "@gabrielvfonseca/signal",
		"description": "Operator Signal channel plugin",
		"source": "official",
		"kind": "channel",
		"@gabrielvfonseca/operator": {
			"channel": {
				"id": "signal",
				"label": "Signal",
				"selectionLabel": "Signal (signal-cli)",
				"detailLabel": "Signal REST",
				"docsPath": "/channels/signal",
				"docsLabel": "signal",
				"blurb": "signal-cli linked device with extra setup for the local REST bridge.",
				"systemImage": "antenna.radiowaves.left.and.right",
				"markdownCapable": true,
				"cliAddOptions": [
					{
						"flags": "--signal-number <e164>",
						"description": "Signal account number (E.164)"
					},
					{
						"flags": "--http-host <host>",
						"description": "Signal HTTP daemon host"
					},
					{
						"flags": "--http-port <port>",
						"description": "Signal HTTP daemon port"
					}
				]
			},
			"install": {
				"clawhubSpec": "clawhub:@gabrielvfonseca/signal",
				"npmSpec": "@gabrielvfonseca/signal",
				"defaultChoice": "npm",
				"minHostVersion": ">=2026.6.9",
				"allowInvalidConfigRecovery": true
			}
		}
	},
	{
		"name": "@gabrielvfonseca/slack",
		"description": "Operator Slack channel plugin",
		"source": "official",
		"kind": "channel",
		"@gabrielvfonseca/operator": {
			"channel": {
				"id": "slack",
				"label": "Slack",
				"selectionLabel": "Slack (Socket Mode)",
				"detailLabel": "Slack Bot",
				"docsPath": "/channels/slack",
				"docsLabel": "slack",
				"blurb": "supported (Socket Mode).",
				"systemImage": "number",
				"markdownCapable": true
			},
			"channelConfigs": { "slack": {
				"label": "Slack",
				"description": "Slack channel, DM, command, and app event integration.",
				"schema": {
					"type": "object",
					"additionalProperties": true
				}
			} },
			"install": {
				"npmSpec": "@gabrielvfonseca/slack",
				"defaultChoice": "npm",
				"minHostVersion": ">=2026.5.12-beta.1",
				"allowInvalidConfigRecovery": true
			}
		}
	},
	{
		"name": "@gabrielvfonseca/sms",
		"description": "Operator SMS channel plugin for Twilio text messages.",
		"source": "official",
		"kind": "channel",
		"@gabrielvfonseca/operator": {
			"channel": {
				"id": "sms",
				"label": "SMS",
				"selectionLabel": "SMS (Twilio)",
				"detailLabel": "Twilio SMS",
				"docsPath": "/channels/sms",
				"docsLabel": "sms",
				"blurb": "Twilio-backed SMS with inbound webhooks and outbound replies.",
				"envVars": [
					"TWILIO_ACCOUNT_SID",
					"TWILIO_AUTH_TOKEN",
					"TWILIO_PHONE_NUMBER",
					"TWILIO_SMS_FROM",
					"TWILIO_MESSAGING_SERVICE_SID",
					"SMS_PUBLIC_WEBHOOK_URL",
					"SMS_WEBHOOK_PATH",
					"SMS_ALLOWED_USERS"
				],
				"order": 88,
				"quickstartAllowFrom": true
			},
			"install": {
				"clawhubSpec": "clawhub:@gabrielvfonseca/sms",
				"npmSpec": "@gabrielvfonseca/sms",
				"defaultChoice": "npm",
				"minHostVersion": ">=2026.6.9",
				"allowInvalidConfigRecovery": true
			}
		}
	},
	{
		"name": "@gabrielvfonseca/synology-chat",
		"description": "Synology Chat channel plugin for Operator",
		"source": "official",
		"kind": "channel",
		"@gabrielvfonseca/operator": {
			"channel": {
				"id": "synology-chat",
				"label": "Synology Chat",
				"selectionLabel": "Synology Chat (Webhook)",
				"docsPath": "/channels/synology-chat",
				"docsLabel": "synology-chat",
				"blurb": "Connect your Synology NAS Chat to Operator with full agent capabilities.",
				"order": 90
			},
			"install": {
				"npmSpec": "@gabrielvfonseca/synology-chat",
				"defaultChoice": "npm",
				"minHostVersion": ">=2026.4.10"
			}
		}
	},
	{
		"name": "@gabrielvfonseca/raft",
		"description": "Operator Raft channel plugin",
		"source": "official",
		"kind": "channel",
		"@gabrielvfonseca/operator": {
			"channel": {
				"id": "raft",
				"label": "Raft",
				"selectionLabel": "Raft (CLI wake bridge)",
				"docsPath": "/channels/raft",
				"docsLabel": "raft",
				"blurb": "Raft CLI wake bridge for human and agent collaboration.",
				"order": 72
			},
			"channelConfigs": { "raft": {
				"label": "Raft",
				"description": "Raft External Agent CLI wake bridge.",
				"schema": {
					"type": "object",
					"additionalProperties": false,
					"properties": {
						"name": { "type": "string" },
						"enabled": { "type": "boolean" },
						"profile": {
							"type": "string",
							"minLength": 1
						},
						"defaultAccount": { "type": "string" },
						"accounts": {
							"type": "object",
							"additionalProperties": {
								"type": "object",
								"additionalProperties": false,
								"properties": {
									"name": { "type": "string" },
									"enabled": { "type": "boolean" },
									"profile": {
										"type": "string",
										"minLength": 1
									}
								}
							}
						}
					}
				}
			} },
			"install": {
				"npmSpec": "@gabrielvfonseca/raft",
				"defaultChoice": "npm",
				"minHostVersion": ">=2026.6.8"
			}
		}
	},
	{
		"name": "@gabrielvfonseca/tlon",
		"description": "Operator Tlon/Urbit channel plugin",
		"source": "official",
		"kind": "channel",
		"@gabrielvfonseca/operator": {
			"channel": {
				"id": "tlon",
				"label": "Tlon",
				"selectionLabel": "Tlon (Urbit)",
				"docsPath": "/channels/tlon",
				"docsLabel": "tlon",
				"blurb": "decentralized messaging on Urbit; install the plugin to enable.",
				"order": 90,
				"quickstartAllowFrom": true
			},
			"install": {
				"npmSpec": "@gabrielvfonseca/tlon",
				"defaultChoice": "npm",
				"minHostVersion": ">=2026.4.10"
			}
		}
	},
	{
		"name": "@gabrielvfonseca/twitch",
		"description": "Operator Twitch channel plugin",
		"source": "official",
		"kind": "channel",
		"@gabrielvfonseca/operator": {
			"channel": {
				"id": "twitch",
				"label": "Twitch",
				"selectionLabel": "Twitch (Chat)",
				"docsPath": "/channels/twitch",
				"blurb": "Twitch chat integration",
				"aliases": ["twitch-chat"]
			},
			"install": {
				"npmSpec": "@gabrielvfonseca/twitch",
				"defaultChoice": "npm",
				"minHostVersion": ">=2026.4.10"
			}
		}
	},
	{
		"name": "@gabrielvfonseca/whatsapp",
		"description": "Operator WhatsApp channel plugin",
		"source": "official",
		"kind": "channel",
		"@gabrielvfonseca/operator": {
			"channel": {
				"id": "whatsapp",
				"label": "WhatsApp",
				"selectionLabel": "WhatsApp (QR link)",
				"detailLabel": "WhatsApp Web",
				"docsPath": "/channels/whatsapp",
				"docsLabel": "whatsapp",
				"blurb": "works with your own number; recommend a separate phone + eSIM.",
				"systemImage": "message"
			},
			"install": {
				"clawhubSpec": "clawhub:@gabrielvfonseca/whatsapp",
				"npmSpec": "@gabrielvfonseca/whatsapp",
				"defaultChoice": "clawhub",
				"minHostVersion": ">=2026.4.25"
			}
		}
	},
	{
		"name": "@gabrielvfonseca/zalo",
		"description": "Operator Zalo channel plugin",
		"source": "official",
		"kind": "channel",
		"@gabrielvfonseca/operator": {
			"channel": {
				"id": "zalo",
				"label": "Zalo",
				"selectionLabel": "Zalo (Bot API)",
				"docsPath": "/channels/zalo",
				"docsLabel": "zalo",
				"blurb": "Vietnam-focused messaging platform with Bot API.",
				"aliases": ["zl"],
				"order": 80,
				"quickstartAllowFrom": true
			},
			"install": {
				"npmSpec": "@gabrielvfonseca/zalo",
				"defaultChoice": "npm",
				"minHostVersion": ">=2026.4.10"
			}
		}
	},
	{
		"name": "@gabrielvfonseca/zalouser",
		"description": "Operator Zalo Personal Account plugin via native zca-js integration",
		"source": "official",
		"kind": "channel",
		"@gabrielvfonseca/operator": {
			"channel": {
				"id": "zalouser",
				"label": "Zalo Personal",
				"selectionLabel": "Zalo (Personal Account)",
				"docsPath": "/channels/zalouser",
				"docsLabel": "zalouser",
				"blurb": "Zalo personal account via QR code login.",
				"aliases": ["zlu"],
				"order": 85,
				"quickstartAllowFrom": false
			},
			"install": {
				"npmSpec": "@gabrielvfonseca/zalouser",
				"defaultChoice": "npm",
				"minHostVersion": ">=2026.4.10"
			}
		}
	}
] };
//#endregion
//#region scripts/lib/official-external-plugin-catalog.json
var official_external_plugin_catalog_default = {
	schemaVersion: 1,
	id: "operator-official-external-plugins",
	generatedAt: "2026-06-22T00:00:00.000Z",
	sequence: 1,
	description: "Bundled fallback feed for official external Operator plugins.",
	entries: [
		{
			"name": "@gabrielvfonseca/acpx",
			"description": "Operator ACP runtime backend",
			"source": "official",
			"kind": "plugin",
			"@gabrielvfonseca/operator": {
				"plugin": {
					"id": "acpx",
					"label": "ACPX Runtime"
				},
				"install": {
					"npmSpec": "@gabrielvfonseca/acpx",
					"defaultChoice": "npm",
					"minHostVersion": ">=2026.4.25"
				}
			}
		},
		{
			"name": "@gabrielvfonseca/brave-plugin",
			"description": "Operator Brave plugin",
			"source": "official",
			"kind": "plugin",
			"@gabrielvfonseca/operator": {
				"plugin": {
					"id": "brave",
					"label": "Brave"
				},
				"webSearchProviders": [{
					"id": "brave",
					"label": "Brave Search",
					"hint": "Brave Search web results.",
					"onboardingScopes": ["text-inference"],
					"credentialLabel": "Brave Search API key",
					"envVars": ["BRAVE_API_KEY"],
					"placeholder": "BSA...",
					"signupUrl": "https://api-dashboard.search.brave.com/app/keys",
					"docsUrl": "https://docs.operator.ai/tools/brave-search",
					"credentialPath": "plugins.entries.brave.config.webSearch.apiKey",
					"autoDetectOrder": 10
				}],
				"install": {
					"npmSpec": "@gabrielvfonseca/brave-plugin",
					"defaultChoice": "npm",
					"minHostVersion": ">=2026.4.10",
					"allowInvalidConfigRecovery": true
				}
			}
		},
		{
			"name": "@gabrielvfonseca/copilot",
			"description": "Operator GitHub Copilot agent runtime plugin",
			"source": "official",
			"kind": "plugin",
			"@gabrielvfonseca/operator": {
				"plugin": {
					"id": "copilot",
					"label": "GitHub Copilot agent runtime"
				},
				"install": {
					"clawhubSpec": "clawhub:@gabrielvfonseca/copilot",
					"npmSpec": "@gabrielvfonseca/copilot",
					"defaultChoice": "npm",
					"minHostVersion": ">=2026.5.28"
				}
			}
		},
		{
			"name": "@gabrielvfonseca/diagnostics-otel",
			"description": "Operator diagnostics OpenTelemetry exporter",
			"source": "official",
			"kind": "plugin",
			"@gabrielvfonseca/operator": {
				"plugin": {
					"id": "diagnostics-otel",
					"label": "Diagnostics OpenTelemetry"
				},
				"install": {
					"clawhubSpec": "clawhub:@gabrielvfonseca/diagnostics-otel",
					"npmSpec": "@gabrielvfonseca/diagnostics-otel",
					"defaultChoice": "npm",
					"minHostVersion": ">=2026.4.25"
				}
			}
		},
		{
			"name": "@gabrielvfonseca/diagnostics-prometheus",
			"description": "Operator diagnostics Prometheus exporter",
			"source": "official",
			"kind": "plugin",
			"@gabrielvfonseca/operator": {
				"plugin": {
					"id": "diagnostics-prometheus",
					"label": "Diagnostics Prometheus"
				},
				"install": {
					"clawhubSpec": "clawhub:@gabrielvfonseca/diagnostics-prometheus",
					"npmSpec": "@gabrielvfonseca/diagnostics-prometheus",
					"defaultChoice": "npm",
					"minHostVersion": ">=2026.4.25"
				}
			}
		},
		{
			"name": "@gabrielvfonseca/diffs",
			"description": "Operator diff viewer plugin",
			"source": "official",
			"kind": "plugin",
			"@gabrielvfonseca/operator": {
				"plugin": {
					"id": "diffs",
					"label": "Diffs"
				},
				"catalog": {
					"featured": true,
					"order": 40
				},
				"install": {
					"clawhubSpec": "clawhub:@gabrielvfonseca/diffs",
					"npmSpec": "@gabrielvfonseca/diffs",
					"defaultChoice": "npm",
					"minHostVersion": ">=2026.4.30"
				}
			}
		},
		{
			"name": "@gabrielvfonseca/diffs-language-pack",
			"description": "Operator diffs viewer syntax highlighting language pack",
			"source": "official",
			"kind": "plugin",
			"@gabrielvfonseca/operator": {
				"plugin": {
					"id": "diffs-language-pack",
					"label": "Diff Viewer Language Pack"
				},
				"install": {
					"npmSpec": "@gabrielvfonseca/diffs-language-pack",
					"clawhubSpec": "clawhub:@gabrielvfonseca/diffs-language-pack",
					"defaultChoice": "npm",
					"minHostVersion": ">=2026.5.27"
				}
			}
		},
		{
			"name": "@gabrielvfonseca/exa-plugin",
			"description": "Operator Exa plugin.",
			"source": "official",
			"kind": "plugin",
			"@gabrielvfonseca/operator": {
				"plugin": {
					"id": "exa",
					"label": "Exa"
				},
				"contracts": { "webSearchProviders": ["exa"] },
				"webSearchProviders": [{
					"id": "exa",
					"label": "Exa Search",
					"hint": "Neural + keyword search with date filters and content extraction",
					"onboardingScopes": ["text-inference"],
					"credentialLabel": "Exa API key",
					"envVars": ["EXA_API_KEY"],
					"placeholder": "exa-...",
					"signupUrl": "https://exa.ai/",
					"docsUrl": "https://docs.operator.ai/tools/web",
					"credentialPath": "plugins.entries.exa.config.webSearch.apiKey",
					"autoDetectOrder": 65
				}],
				"install": {
					"clawhubSpec": "clawhub:@gabrielvfonseca/exa-plugin",
					"npmSpec": "@gabrielvfonseca/exa-plugin",
					"defaultChoice": "npm",
					"minHostVersion": ">=2026.6.8"
				}
			}
		},
		{
			"name": "@gabrielvfonseca/firecrawl-plugin",
			"description": "Operator Firecrawl plugin.",
			"source": "official",
			"kind": "plugin",
			"@gabrielvfonseca/operator": {
				"plugin": {
					"id": "firecrawl",
					"label": "Firecrawl"
				},
				"contracts": {
					"webFetchProviders": ["firecrawl"],
					"webSearchProviders": ["firecrawl", "firecrawl-free"],
					"tools": ["firecrawl_search", "firecrawl_scrape"]
				},
				"webSearchProviders": [{
					"id": "firecrawl",
					"label": "Firecrawl Search",
					"hint": "Structured results with optional result scraping",
					"onboardingScopes": ["text-inference"],
					"credentialLabel": "Firecrawl API key",
					"envVars": ["FIRECRAWL_API_KEY"],
					"placeholder": "fc-...",
					"signupUrl": "https://www.firecrawl.dev/",
					"docsUrl": "https://docs.operator.ai/tools/firecrawl",
					"credentialPath": "plugins.entries.firecrawl.config.webSearch.apiKey",
					"autoDetectOrder": 60
				}, {
					"id": "firecrawl-free",
					"label": "Firecrawl Search (Free)",
					"hint": "Free web search via Firecrawl's hosted starter tier — no API key required",
					"onboardingScopes": ["text-inference"],
					"requiresCredential": false,
					"envVars": [],
					"placeholder": "(no key needed)",
					"signupUrl": "https://www.firecrawl.dev/",
					"docsUrl": "https://docs.operator.ai/tools/firecrawl",
					"credentialPath": ""
				}],
				"install": {
					"clawhubSpec": "clawhub:@gabrielvfonseca/firecrawl-plugin",
					"npmSpec": "@gabrielvfonseca/firecrawl-plugin",
					"defaultChoice": "npm",
					"minHostVersion": ">=2026.6.8"
				}
			}
		},
		{
			"name": "@gabrielvfonseca/google-meet",
			"description": "Operator Google Meet participant plugin",
			"source": "official",
			"kind": "plugin",
			"@gabrielvfonseca/operator": {
				"plugin": {
					"id": "google-meet",
					"label": "Google Meet"
				},
				"install": {
					"npmSpec": "@gabrielvfonseca/google-meet",
					"defaultChoice": "npm",
					"minHostVersion": ">=2026.4.20"
				}
			}
		},
		{
			"name": "@gabrielvfonseca/gradium-speech",
			"description": "Operator Gradium speech plugin.",
			"source": "official",
			"kind": "plugin",
			"@gabrielvfonseca/operator": {
				"plugin": {
					"id": "gradium",
					"label": "Gradium"
				},
				"contracts": { "speechProviders": ["gradium"] },
				"install": {
					"clawhubSpec": "clawhub:@gabrielvfonseca/gradium-speech",
					"npmSpec": "@gabrielvfonseca/gradium-speech",
					"defaultChoice": "npm",
					"minHostVersion": ">=2026.6.8"
				}
			}
		},
		{
			"name": "@gabrielvfonseca/inworld-speech",
			"description": "Operator Inworld speech plugin.",
			"source": "official",
			"kind": "plugin",
			"@gabrielvfonseca/operator": {
				"plugin": {
					"id": "inworld",
					"label": "Inworld"
				},
				"contracts": { "speechProviders": ["inworld"] },
				"install": {
					"clawhubSpec": "clawhub:@gabrielvfonseca/inworld-speech",
					"npmSpec": "@gabrielvfonseca/inworld-speech",
					"defaultChoice": "npm",
					"minHostVersion": ">=2026.6.8"
				}
			}
		},
		{
			"name": "@gabrielvfonseca/lobster",
			"description": "Lobster workflow tool plugin (typed pipelines + resumable approvals)",
			"source": "official",
			"kind": "plugin",
			"@gabrielvfonseca/operator": {
				"plugin": {
					"id": "lobster",
					"label": "Lobster"
				},
				"catalog": {
					"featured": true,
					"order": 50
				},
				"install": {
					"clawhubSpec": "clawhub:@gabrielvfonseca/lobster",
					"npmSpec": "@gabrielvfonseca/lobster",
					"defaultChoice": "npm",
					"minHostVersion": ">=2026.4.25"
				}
			}
		},
		{
			"name": "@gabrielvfonseca/memory-lancedb",
			"description": "Operator LanceDB-backed long-term memory plugin with auto-recall/capture",
			"source": "official",
			"kind": "plugin",
			"@gabrielvfonseca/operator": {
				"plugin": {
					"id": "memory-lancedb",
					"label": "Memory LanceDB"
				},
				"catalog": {
					"featured": true,
					"order": 70
				},
				"install": {
					"clawhubSpec": "clawhub:@gabrielvfonseca/memory-lancedb",
					"npmSpec": "@gabrielvfonseca/memory-lancedb",
					"defaultChoice": "npm",
					"minHostVersion": ">=2026.5.31"
				}
			}
		},
		{
			"name": "@gabrielvfonseca/llama-cpp-provider",
			"description": "Operator llama.cpp embedding provider plugin",
			"source": "official",
			"kind": "plugin",
			"@gabrielvfonseca/operator": {
				"plugin": {
					"id": "llama-cpp",
					"label": "llama.cpp Provider"
				},
				"contracts": { "embeddingProviders": ["local"] },
				"install": {
					"npmSpec": "@gabrielvfonseca/llama-cpp-provider",
					"defaultChoice": "npm",
					"minHostVersion": ">=2026.6.2"
				}
			}
		},
		{
			"name": "@gabrielvfonseca/openshell-sandbox",
			"description": "Operator OpenShell sandbox backend",
			"source": "official",
			"kind": "plugin",
			"@gabrielvfonseca/operator": {
				"plugin": {
					"id": "openshell",
					"label": "OpenShell Sandbox"
				},
				"install": {
					"npmSpec": "@gabrielvfonseca/openshell-sandbox",
					"defaultChoice": "npm",
					"minHostVersion": ">=2026.5.12-beta.1"
				}
			}
		},
		{
			"name": "@gabrielvfonseca/parallel-plugin",
			"description": "Operator Parallel web search plugin.",
			"source": "official",
			"kind": "plugin",
			"@gabrielvfonseca/operator": {
				"plugin": {
					"id": "parallel",
					"label": "Parallel"
				},
				"contracts": { "webSearchProviders": ["parallel", "parallel-free"] },
				"webSearchProviders": [{
					"id": "parallel",
					"label": "Parallel Search",
					"hint": "LLM-optimized dense excerpts from web sources",
					"onboardingScopes": ["text-inference"],
					"credentialLabel": "Parallel API key",
					"envVars": ["PARALLEL_API_KEY"],
					"placeholder": "par-...",
					"signupUrl": "https://platform.parallel.ai",
					"docsUrl": "https://docs.operator.ai/tools/parallel-search",
					"credentialPath": "plugins.entries.parallel.config.webSearch.apiKey",
					"autoDetectOrder": 75
				}, {
					"id": "parallel-free",
					"label": "Parallel Search (Free)",
					"hint": "Free web search via Parallel's hosted Search MCP — no API key required",
					"onboardingScopes": ["text-inference"],
					"requiresCredential": false,
					"envVars": [],
					"placeholder": "(no key needed)",
					"signupUrl": "https://parallel.ai",
					"docsUrl": "https://docs.operator.ai/tools/parallel-search",
					"credentialPath": ""
				}],
				"install": {
					"clawhubSpec": "clawhub:@gabrielvfonseca/parallel-plugin",
					"npmSpec": "@gabrielvfonseca/parallel-plugin",
					"defaultChoice": "npm",
					"minHostVersion": ">=2026.6.8"
				}
			}
		},
		{
			"name": "@gabrielvfonseca/perplexity-plugin",
			"description": "Operator Perplexity plugin.",
			"source": "official",
			"kind": "plugin",
			"@gabrielvfonseca/operator": {
				"plugin": {
					"id": "perplexity",
					"label": "Perplexity"
				},
				"contracts": { "webSearchProviders": ["perplexity"] },
				"webSearchProviders": [{
					"id": "perplexity",
					"label": "Perplexity Search",
					"hint": "Requires Perplexity API key or OpenRouter API key · structured results",
					"onboardingScopes": ["text-inference"],
					"credentialLabel": "Perplexity API key",
					"envVars": ["PERPLEXITY_API_KEY", "OPENROUTER_API_KEY"],
					"placeholder": "pplx-...",
					"signupUrl": "https://www.perplexity.ai/settings/api",
					"docsUrl": "https://docs.operator.ai/perplexity",
					"credentialPath": "plugins.entries.perplexity.config.webSearch.apiKey",
					"autoDetectOrder": 50
				}],
				"install": {
					"clawhubSpec": "clawhub:@gabrielvfonseca/perplexity-plugin",
					"npmSpec": "@gabrielvfonseca/perplexity-plugin",
					"defaultChoice": "npm",
					"minHostVersion": ">=2026.6.8"
				}
			}
		},
		{
			"name": "@gabrielvfonseca/pixverse-provider",
			"description": "Operator PixVerse video generation provider plugin",
			"source": "official",
			"kind": "plugin",
			"@gabrielvfonseca/operator": {
				"plugin": {
					"id": "pixverse",
					"label": "PixVerse"
				},
				"install": {
					"clawhubSpec": "clawhub:@gabrielvfonseca/pixverse-provider",
					"npmSpec": "@gabrielvfonseca/pixverse-provider",
					"defaultChoice": "npm",
					"minHostVersion": ">=2026.5.26"
				}
			}
		},
		{
			"name": "@gabrielvfonseca/searxng-plugin",
			"description": "Operator SearXNG plugin",
			"source": "official",
			"kind": "plugin",
			"@gabrielvfonseca/operator": {
				"plugin": {
					"id": "searxng",
					"label": "SearXNG"
				},
				"contracts": { "webSearchProviders": ["searxng"] },
				"webSearchProviders": [{
					"id": "searxng",
					"label": "SearXNG Search",
					"hint": "Self-hosted meta-search with no API key required",
					"onboardingScopes": ["text-inference"],
					"requiresCredential": true,
					"credentialLabel": "SearXNG Base URL",
					"envVars": ["SEARXNG_BASE_URL"],
					"placeholder": "http://localhost:8080",
					"signupUrl": "https://docs.searxng.org/",
					"docsUrl": "https://docs.operator.ai/tools/searxng-search",
					"credentialPath": "plugins.entries.searxng.config.webSearch.baseUrl",
					"autoDetectOrder": 200
				}],
				"install": {
					"clawhubSpec": "clawhub:@gabrielvfonseca/searxng-plugin",
					"npmSpec": "@gabrielvfonseca/searxng-plugin",
					"defaultChoice": "npm",
					"minHostVersion": ">=2026.6.9",
					"allowInvalidConfigRecovery": true
				}
			}
		},
		{
			"name": "@gabrielvfonseca/tavily-plugin",
			"description": "Operator Tavily plugin",
			"source": "official",
			"kind": "plugin",
			"@gabrielvfonseca/operator": {
				"plugin": {
					"id": "tavily",
					"label": "Tavily"
				},
				"contracts": {
					"webSearchProviders": ["tavily"],
					"tools": ["tavily_search", "tavily_extract"]
				},
				"webSearchProviders": [{
					"id": "tavily",
					"label": "Tavily Search",
					"hint": "Structured results with domain filters and AI answer summaries",
					"onboardingScopes": ["text-inference"],
					"credentialLabel": "Tavily API key",
					"envVars": ["TAVILY_API_KEY"],
					"placeholder": "tvly-...",
					"signupUrl": "https://tavily.com/",
					"docsUrl": "https://docs.operator.ai/tools/tavily",
					"credentialPath": "plugins.entries.tavily.config.webSearch.apiKey",
					"autoDetectOrder": 70
				}],
				"install": {
					"clawhubSpec": "clawhub:@gabrielvfonseca/tavily-plugin",
					"npmSpec": "@gabrielvfonseca/tavily-plugin",
					"defaultChoice": "npm",
					"minHostVersion": ">=2026.6.9",
					"allowInvalidConfigRecovery": true
				}
			}
		},
		{
			"name": "@gabrielvfonseca/tokenjuice",
			"description": "Operator tokenjuice exec output compaction plugin",
			"source": "official",
			"kind": "plugin",
			"@gabrielvfonseca/operator": {
				"plugin": {
					"id": "tokenjuice",
					"label": "Tokenjuice"
				},
				"catalog": {
					"featured": true,
					"order": 60
				},
				"install": {
					"clawhubSpec": "clawhub:@gabrielvfonseca/tokenjuice",
					"npmSpec": "@gabrielvfonseca/tokenjuice",
					"defaultChoice": "npm",
					"minHostVersion": ">=2026.5.28"
				}
			}
		},
		{
			"name": "@gabrielvfonseca/voice-call",
			"description": "Operator voice-call plugin",
			"source": "official",
			"kind": "plugin",
			"@gabrielvfonseca/operator": {
				"plugin": {
					"id": "voice-call",
					"label": "Voice Call"
				},
				"install": {
					"npmSpec": "@gabrielvfonseca/voice-call",
					"defaultChoice": "npm",
					"minHostVersion": ">=2026.4.10"
				}
			}
		}
	]
};
//#endregion
//#region scripts/lib/official-external-provider-catalog.json
var official_external_provider_catalog_default = { entries: [
	{
		"name": "@gabrielvfonseca/amazon-bedrock-provider",
		"description": "Operator Amazon Bedrock provider plugin",
		"source": "official",
		"kind": "provider",
		"@gabrielvfonseca/operator": {
			"plugin": {
				"id": "amazon-bedrock",
				"label": "Amazon Bedrock"
			},
			"providers": [{
				"id": "amazon-bedrock",
				"name": "Amazon Bedrock",
				"docs": "/providers/bedrock",
				"categories": ["cloud", "llm"]
			}],
			"install": {
				"npmSpec": "@gabrielvfonseca/amazon-bedrock-provider",
				"defaultChoice": "npm",
				"minHostVersion": ">=2026.5.12-beta.1"
			}
		}
	},
	{
		"name": "@gabrielvfonseca/amazon-bedrock-mantle-provider",
		"description": "Operator Amazon Bedrock Mantle provider plugin",
		"source": "official",
		"kind": "provider",
		"@gabrielvfonseca/operator": {
			"plugin": {
				"id": "amazon-bedrock-mantle",
				"label": "Amazon Bedrock Mantle"
			},
			"providers": [{
				"id": "amazon-bedrock-mantle",
				"name": "Amazon Bedrock Mantle",
				"docs": "/providers/bedrock-mantle",
				"categories": ["cloud", "llm"]
			}],
			"install": {
				"npmSpec": "@gabrielvfonseca/amazon-bedrock-mantle-provider",
				"defaultChoice": "npm",
				"minHostVersion": ">=2026.5.12-beta.1"
			}
		}
	},
	{
		"name": "@gabrielvfonseca/anthropic-vertex-provider",
		"description": "Operator Anthropic Vertex provider plugin",
		"source": "official",
		"kind": "provider",
		"@gabrielvfonseca/operator": {
			"plugin": {
				"id": "anthropic-vertex",
				"label": "Anthropic Vertex"
			},
			"providers": [{
				"id": "anthropic-vertex",
				"name": "Anthropic Vertex",
				"docs": "/providers/models",
				"categories": ["cloud", "llm"]
			}],
			"install": {
				"npmSpec": "@gabrielvfonseca/anthropic-vertex-provider",
				"defaultChoice": "npm",
				"minHostVersion": ">=2026.5.12-beta.1"
			}
		}
	},
	{
		"name": "@gabrielvfonseca/arcee-provider",
		"description": "Operator Arcee provider plugin.",
		"source": "official",
		"kind": "provider",
		"@gabrielvfonseca/operator": {
			"plugin": {
				"id": "arcee",
				"label": "Arcee AI"
			},
			"providers": [{
				"id": "arcee",
				"name": "Arcee AI",
				"docs": "/providers/arcee",
				"categories": ["cloud", "llm"],
				"envVars": ["ARCEEAI_API_KEY"],
				"authChoices": [{
					"method": "arcee-platform",
					"choiceId": "arceeai-api-key",
					"choiceLabel": "Arcee AI API key",
					"choiceHint": "Direct (chat.arcee.ai)",
					"groupId": "arcee",
					"groupLabel": "Arcee AI",
					"groupHint": "Direct API or OpenRouter",
					"optionKey": "arceeaiApiKey",
					"cliFlag": "--arceeai-api-key",
					"cliOption": "--arceeai-api-key <key>",
					"cliDescription": "Arcee AI API key",
					"onboardingScopes": ["text-inference"]
				}, {
					"method": "openrouter",
					"choiceId": "arceeai-openrouter",
					"choiceLabel": "OpenRouter API key",
					"choiceHint": "Via OpenRouter (openrouter.ai)",
					"groupId": "arcee",
					"groupLabel": "Arcee AI",
					"groupHint": "Direct API or OpenRouter",
					"optionKey": "openrouterApiKey",
					"cliFlag": "--openrouter-api-key",
					"cliOption": "--openrouter-api-key <key>",
					"cliDescription": "OpenRouter API key for Arcee AI models",
					"onboardingScopes": ["text-inference"]
				}]
			}],
			"install": {
				"clawhubSpec": "clawhub:@gabrielvfonseca/arcee-provider",
				"npmSpec": "@gabrielvfonseca/arcee-provider",
				"defaultChoice": "npm",
				"minHostVersion": ">=2026.6.8"
			}
		}
	},
	{
		"name": "@gabrielvfonseca/cerebras-provider",
		"description": "Operator Cerebras provider plugin.",
		"source": "official",
		"kind": "provider",
		"@gabrielvfonseca/operator": {
			"plugin": {
				"id": "cerebras",
				"label": "Cerebras"
			},
			"providerEndpoints": [{
				"endpointClass": "cerebras-native",
				"hosts": ["api.cerebras.ai"]
			}],
			"providers": [{
				"id": "cerebras",
				"name": "Cerebras",
				"docs": "/providers/cerebras",
				"categories": ["cloud", "llm"],
				"envVars": ["CEREBRAS_API_KEY"],
				"authChoices": [{
					"method": "api-key",
					"choiceId": "cerebras-api-key",
					"choiceLabel": "Cerebras API key",
					"groupId": "cerebras",
					"groupLabel": "Cerebras",
					"groupHint": "Fast OpenAI-compatible inference",
					"optionKey": "cerebrasApiKey",
					"cliFlag": "--cerebras-api-key",
					"cliOption": "--cerebras-api-key <key>",
					"cliDescription": "Cerebras API key",
					"onboardingScopes": ["text-inference"]
				}]
			}],
			"install": {
				"clawhubSpec": "clawhub:@gabrielvfonseca/cerebras-provider",
				"npmSpec": "@gabrielvfonseca/cerebras-provider",
				"defaultChoice": "npm",
				"minHostVersion": ">=2026.6.8"
			}
		}
	},
	{
		"name": "@gabrielvfonseca/chutes-provider",
		"description": "Operator Chutes.ai provider plugin.",
		"source": "official",
		"kind": "provider",
		"@gabrielvfonseca/operator": {
			"plugin": {
				"id": "chutes",
				"label": "Chutes"
			},
			"providerEndpoints": [{
				"endpointClass": "chutes-native",
				"hosts": ["llm.chutes.ai"]
			}],
			"providers": [{
				"id": "chutes",
				"name": "Chutes",
				"docs": "/providers/chutes",
				"categories": ["cloud", "llm"],
				"envVars": ["CHUTES_API_KEY", "CHUTES_OAUTH_TOKEN"],
				"authChoices": [{
					"method": "oauth",
					"choiceId": "chutes",
					"choiceLabel": "Chutes (OAuth)",
					"choiceHint": "Browser sign-in",
					"groupId": "chutes",
					"groupLabel": "Chutes",
					"groupHint": "OAuth + API key",
					"onboardingScopes": ["text-inference"]
				}, {
					"method": "api-key",
					"choiceId": "chutes-api-key",
					"choiceLabel": "Chutes API key",
					"choiceHint": "Open-source models including Llama, DeepSeek, and more",
					"groupId": "chutes",
					"groupLabel": "Chutes",
					"groupHint": "OAuth + API key",
					"optionKey": "chutesApiKey",
					"cliFlag": "--chutes-api-key",
					"cliOption": "--chutes-api-key <key>",
					"cliDescription": "Chutes API key",
					"onboardingScopes": ["text-inference"]
				}]
			}],
			"install": {
				"clawhubSpec": "clawhub:@gabrielvfonseca/chutes-provider",
				"npmSpec": "@gabrielvfonseca/chutes-provider",
				"defaultChoice": "npm",
				"minHostVersion": ">=2026.6.8"
			}
		}
	},
	{
		"name": "@gabrielvfonseca/cohere-provider",
		"description": "Operator Cohere provider plugin",
		"source": "official",
		"kind": "provider",
		"@gabrielvfonseca/operator": {
			"plugin": {
				"id": "cohere",
				"label": "Cohere"
			},
			"providers": [{
				"id": "cohere",
				"name": "Cohere",
				"docs": "/providers/cohere",
				"categories": ["cloud", "llm"],
				"authChoices": [{
					"method": "api-key",
					"choiceId": "cohere-api-key",
					"choiceLabel": "Cohere API key",
					"groupId": "cohere",
					"groupLabel": "Cohere",
					"groupHint": "OpenAI-compatible inference",
					"optionKey": "cohereApiKey",
					"cliFlag": "--cohere-api-key",
					"cliOption": "--cohere-api-key <key>",
					"cliDescription": "Cohere API key",
					"onboardingScopes": ["text-inference"]
				}]
			}],
			"install": {
				"clawhubSpec": "clawhub:@gabrielvfonseca/cohere-provider",
				"npmSpec": "@gabrielvfonseca/cohere-provider",
				"defaultChoice": "npm",
				"minHostVersion": ">=2026.6.8"
			}
		}
	},
	{
		"name": "@gabrielvfonseca/cloudflare-ai-gateway-provider",
		"description": "Operator Cloudflare AI Gateway provider plugin.",
		"source": "official",
		"kind": "provider",
		"@gabrielvfonseca/operator": {
			"plugin": {
				"id": "cloudflare-ai-gateway",
				"label": "Cloudflare AI Gateway"
			},
			"providers": [{
				"id": "cloudflare-ai-gateway",
				"name": "Cloudflare AI Gateway",
				"docs": "/providers/cloudflare-ai-gateway",
				"categories": ["cloud", "llm"],
				"envVars": ["CLOUDFLARE_AI_GATEWAY_API_KEY"],
				"authChoices": [{
					"method": "api-key",
					"choiceId": "cloudflare-ai-gateway-api-key",
					"choiceLabel": "Cloudflare AI Gateway",
					"choiceHint": "Account ID + Gateway ID + API key",
					"groupId": "cloudflare-ai-gateway",
					"groupLabel": "Cloudflare AI Gateway",
					"groupHint": "Account ID + Gateway ID + API key",
					"optionKey": "cloudflareAiGatewayApiKey",
					"cliFlag": "--cloudflare-ai-gateway-api-key",
					"cliOption": "--cloudflare-ai-gateway-api-key <key>",
					"cliDescription": "Cloudflare AI Gateway API key",
					"onboardingScopes": ["text-inference"]
				}]
			}],
			"install": {
				"clawhubSpec": "clawhub:@gabrielvfonseca/cloudflare-ai-gateway-provider",
				"npmSpec": "@gabrielvfonseca/cloudflare-ai-gateway-provider",
				"defaultChoice": "npm",
				"minHostVersion": ">=2026.6.8"
			}
		}
	},
	{
		"name": "@gabrielvfonseca/codex",
		"description": "Operator Codex harness and model provider plugin",
		"source": "official",
		"kind": "provider",
		"@gabrielvfonseca/operator": {
			"plugin": {
				"id": "codex",
				"label": "Codex"
			},
			"contracts": { "migrationProviders": ["codex"] },
			"providers": [{
				"id": "codex",
				"name": "Codex",
				"docs": "/providers/models",
				"categories": ["cloud", "llm"],
				"authChoices": [{
					"method": "app-server",
					"choiceId": "codex",
					"choiceLabel": "Codex app-server",
					"choiceHint": "Keep using your Codex CLI or ChatGPT app sign-in via the Codex app-server runtime.",
					"assistantPriority": -40,
					"groupId": "codex",
					"groupLabel": "Codex",
					"groupHint": "Codex app-server model provider",
					"onboardingScopes": ["text-inference"]
				}]
			}],
			"install": {
				"npmSpec": "@gabrielvfonseca/codex",
				"defaultChoice": "npm",
				"minHostVersion": ">=2026.5.1-beta.1"
			}
		}
	},
	{
		"name": "@gabrielvfonseca/deepinfra-provider",
		"description": "Operator DeepInfra provider plugin.",
		"source": "official",
		"kind": "provider",
		"@gabrielvfonseca/operator": {
			"plugin": {
				"id": "deepinfra",
				"label": "DeepInfra"
			},
			"providerEndpoints": [{
				"endpointClass": "deepinfra-native",
				"hosts": ["api.deepinfra.com"]
			}],
			"providers": [{
				"id": "deepinfra",
				"name": "DeepInfra",
				"docs": "/providers/deepinfra",
				"categories": ["cloud", "llm"],
				"envVars": ["DEEPINFRA_API_KEY"],
				"authChoices": [{
					"method": "api-key",
					"choiceId": "deepinfra-api-key",
					"choiceLabel": "DeepInfra API key",
					"choiceHint": "Unified API for open source models",
					"groupId": "deepinfra",
					"groupLabel": "DeepInfra",
					"groupHint": "Unified API for open source models",
					"optionKey": "deepinfraApiKey",
					"cliFlag": "--deepinfra-api-key",
					"cliOption": "--deepinfra-api-key <key>",
					"cliDescription": "DeepInfra API key",
					"onboardingScopes": ["text-inference"]
				}]
			}],
			"contracts": {
				"mediaUnderstandingProviders": ["deepinfra"],
				"memoryEmbeddingProviders": ["deepinfra"],
				"imageGenerationProviders": ["deepinfra"],
				"speechProviders": ["deepinfra"],
				"videoGenerationProviders": ["deepinfra"]
			},
			"install": {
				"clawhubSpec": "clawhub:@gabrielvfonseca/deepinfra-provider",
				"npmSpec": "@gabrielvfonseca/deepinfra-provider",
				"defaultChoice": "npm",
				"minHostVersion": ">=2026.6.8"
			}
		}
	},
	{
		"name": "@gabrielvfonseca/deepseek-provider",
		"description": "Operator DeepSeek provider plugin.",
		"source": "official",
		"kind": "provider",
		"@gabrielvfonseca/operator": {
			"plugin": {
				"id": "deepseek",
				"label": "DeepSeek"
			},
			"providerEndpoints": [{
				"endpointClass": "deepseek-native",
				"hosts": ["api.deepseek.com"]
			}],
			"providers": [{
				"id": "deepseek",
				"name": "DeepSeek",
				"docs": "/providers/deepseek",
				"categories": ["cloud", "llm"],
				"envVars": ["DEEPSEEK_API_KEY"],
				"authChoices": [{
					"method": "api-key",
					"choiceId": "deepseek-api-key",
					"choiceLabel": "DeepSeek API key",
					"groupId": "deepseek",
					"groupLabel": "DeepSeek",
					"groupHint": "API key",
					"optionKey": "deepseekApiKey",
					"cliFlag": "--deepseek-api-key",
					"cliOption": "--deepseek-api-key <key>",
					"cliDescription": "DeepSeek API key",
					"onboardingScopes": ["text-inference"]
				}]
			}],
			"install": {
				"clawhubSpec": "clawhub:@gabrielvfonseca/deepseek-provider",
				"npmSpec": "@gabrielvfonseca/deepseek-provider",
				"defaultChoice": "npm",
				"minHostVersion": ">=2026.6.8"
			}
		}
	},
	{
		"name": "@gabrielvfonseca/featherless-provider",
		"description": "Operator Featherless AI provider plugin.",
		"source": "official",
		"kind": "provider",
		"@gabrielvfonseca/operator": {
			"plugin": {
				"id": "featherless",
				"label": "Featherless AI"
			},
			"providers": [{
				"id": "featherless",
				"name": "Featherless AI",
				"docs": "/providers/featherless",
				"categories": ["cloud", "llm"],
				"envVars": ["FEATHERLESS_API_KEY"],
				"authChoices": [{
					"method": "api-key",
					"choiceId": "featherless-api-key",
					"choiceLabel": "Featherless AI API key",
					"choiceHint": "OpenAI-compatible access to open models",
					"groupId": "featherless",
					"groupLabel": "Featherless AI",
					"groupHint": "OpenAI-compatible access to open models",
					"optionKey": "featherlessApiKey",
					"cliFlag": "--featherless-api-key",
					"cliOption": "--featherless-api-key <key>",
					"cliDescription": "Featherless AI API key",
					"onboardingScopes": ["text-inference"]
				}]
			}],
			"install": {
				"clawhubSpec": "clawhub:@gabrielvfonseca/featherless-provider",
				"npmSpec": "@gabrielvfonseca/featherless-provider",
				"defaultChoice": "npm",
				"minHostVersion": ">=2026.6.11"
			}
		}
	},
	{
		"name": "@gabrielvfonseca/gmi-provider",
		"description": "Operator GMI Cloud provider plugin",
		"source": "official",
		"kind": "provider",
		"@gabrielvfonseca/operator": {
			"plugin": {
				"id": "gmi",
				"label": "GMI Cloud"
			},
			"providerEndpoints": [{
				"endpointClass": "gmi-native",
				"hosts": ["api.gmi-serving.com"]
			}],
			"providers": [{
				"id": "gmi",
				"aliases": ["gmi-cloud", "gmicloud"],
				"name": "GMI Cloud",
				"docs": "/providers/gmi",
				"categories": ["cloud", "llm"],
				"authChoices": [{
					"method": "api-key",
					"choiceId": "gmi-api-key",
					"choiceLabel": "GMI Cloud API key",
					"choiceHint": "OpenAI-compatible GMI Cloud endpoint.",
					"groupId": "gmi",
					"groupLabel": "GMI Cloud",
					"groupHint": "OpenAI-compatible GMI Cloud endpoint",
					"optionKey": "gmiApiKey",
					"cliFlag": "--gmi-api-key",
					"cliOption": "--gmi-api-key <key>",
					"cliDescription": "GMI Cloud API key",
					"onboardingScopes": ["text-inference"]
				}]
			}],
			"install": {
				"clawhubSpec": "clawhub:@gabrielvfonseca/gmi-provider",
				"npmSpec": "@gabrielvfonseca/gmi-provider",
				"defaultChoice": "npm",
				"minHostVersion": ">=2026.6.8"
			}
		}
	},
	{
		"name": "@gabrielvfonseca/longcat-provider",
		"description": "Operator LongCat provider plugin",
		"source": "official",
		"kind": "provider",
		"@gabrielvfonseca/operator": {
			"plugin": {
				"id": "longcat",
				"label": "LongCat"
			},
			"providers": [{
				"id": "longcat",
				"aliases": ["meituan-longcat"],
				"name": "LongCat",
				"docs": "/providers/longcat",
				"categories": ["cloud", "llm"],
				"envVars": ["LONGCAT_API_KEY"],
				"authChoices": [{
					"method": "api-key",
					"choiceId": "longcat-api-key",
					"choiceLabel": "LongCat API key",
					"groupId": "longcat",
					"groupLabel": "LongCat",
					"groupHint": "OpenAI-compatible LongCat API",
					"optionKey": "longcatApiKey",
					"cliFlag": "--longcat-api-key",
					"cliOption": "--longcat-api-key <key>",
					"cliDescription": "LongCat API key",
					"onboardingScopes": ["text-inference"]
				}]
			}],
			"install": {
				"clawhubSpec": "clawhub:@gabrielvfonseca/longcat-provider",
				"npmSpec": "@gabrielvfonseca/longcat-provider",
				"defaultChoice": "npm",
				"minHostVersion": ">=2026.6.8"
			}
		}
	},
	{
		"name": "@gabrielvfonseca/meta-provider",
		"description": "Operator Meta provider plugin.",
		"source": "official",
		"kind": "provider",
		"@gabrielvfonseca/operator": {
			"plugin": {
				"id": "meta",
				"label": "Meta"
			},
			"providerEndpoints": [{
				"endpointClass": "meta-native",
				"hosts": ["api.meta.ai"]
			}],
			"providers": [{
				"id": "meta",
				"name": "Meta",
				"docs": "/providers/meta",
				"categories": ["cloud", "llm"],
				"envVars": ["MODEL_API_KEY"],
				"authChoices": [{
					"method": "api-key",
					"choiceId": "meta-api-key",
					"choiceLabel": "Meta API key",
					"choiceHint": "Meta (Responses API)",
					"groupId": "meta",
					"groupLabel": "Meta",
					"groupHint": "Meta (Responses API)",
					"optionKey": "metaApiKey",
					"cliFlag": "--meta-api-key",
					"cliOption": "--meta-api-key <key>",
					"cliDescription": "Meta API key",
					"onboardingScopes": ["text-inference"]
				}]
			}],
			"install": {
				"clawhubSpec": "clawhub:@gabrielvfonseca/meta-provider",
				"npmSpec": "@gabrielvfonseca/meta-provider",
				"defaultChoice": "npm",
				"minHostVersion": ">=2026.6.11"
			}
		}
	},
	{
		"name": "@gabrielvfonseca/groq-provider",
		"description": "Operator Groq media-understanding provider.",
		"source": "official",
		"kind": "provider",
		"@gabrielvfonseca/operator": {
			"plugin": {
				"id": "groq",
				"label": "Groq"
			},
			"providerEndpoints": [{
				"endpointClass": "groq-native",
				"hosts": ["api.groq.com"]
			}],
			"providers": [{
				"id": "groq",
				"name": "Groq",
				"docs": "/providers/groq",
				"categories": ["cloud", "llm"],
				"envVars": ["GROQ_API_KEY"],
				"authChoices": [{
					"method": "api-key",
					"choiceId": "groq-api-key",
					"choiceLabel": "Groq API key",
					"groupId": "groq",
					"groupLabel": "Groq",
					"groupHint": "Fast OpenAI-compatible inference",
					"optionKey": "groqApiKey",
					"cliFlag": "--groq-api-key",
					"cliOption": "--groq-api-key <key>",
					"cliDescription": "Groq API key",
					"onboardingScopes": ["text-inference"]
				}]
			}],
			"contracts": { "mediaUnderstandingProviders": ["groq"] },
			"install": {
				"clawhubSpec": "clawhub:@gabrielvfonseca/groq-provider",
				"npmSpec": "@gabrielvfonseca/groq-provider",
				"defaultChoice": "npm",
				"minHostVersion": ">=2026.6.8"
			}
		}
	},
	{
		"name": "@gabrielvfonseca/kilocode-provider",
		"description": "Operator Kilo Gateway provider plugin.",
		"source": "official",
		"kind": "provider",
		"@gabrielvfonseca/operator": {
			"plugin": {
				"id": "kilocode",
				"label": "Kilo Gateway"
			},
			"providers": [{
				"id": "kilocode",
				"name": "Kilo Gateway",
				"docs": "/providers/kilocode",
				"categories": ["cloud", "llm"],
				"envVars": ["KILOCODE_API_KEY"],
				"authChoices": [{
					"method": "api-key",
					"choiceId": "kilocode-api-key",
					"choiceLabel": "Kilo Gateway API key",
					"choiceHint": "API key (OpenRouter-compatible)",
					"groupId": "kilocode",
					"groupLabel": "Kilo Gateway",
					"groupHint": "API key (OpenRouter-compatible)",
					"optionKey": "kilocodeApiKey",
					"cliFlag": "--kilocode-api-key",
					"cliOption": "--kilocode-api-key <key>",
					"cliDescription": "Kilo Gateway API key",
					"onboardingScopes": ["text-inference"]
				}]
			}],
			"install": {
				"clawhubSpec": "clawhub:@gabrielvfonseca/kilocode-provider",
				"npmSpec": "@gabrielvfonseca/kilocode-provider",
				"defaultChoice": "npm",
				"minHostVersion": ">=2026.6.8"
			}
		}
	},
	{
		"name": "@gabrielvfonseca/kimi-provider",
		"description": "Operator Kimi provider plugin.",
		"source": "official",
		"kind": "provider",
		"@gabrielvfonseca/operator": {
			"plugin": {
				"id": "kimi",
				"label": "Kimi Coding"
			},
			"providers": [{
				"id": "kimi",
				"aliases": ["kimi-coding"],
				"name": "Kimi Coding",
				"docs": "/providers/moonshot",
				"categories": ["cloud", "llm"],
				"envVars": ["KIMI_API_KEY", "KIMICODE_API_KEY"],
				"authChoices": [{
					"method": "api-key",
					"choiceId": "kimi-code-api-key",
					"choiceLabel": "Kimi Code API key (subscription)",
					"groupId": "moonshot",
					"groupLabel": "Moonshot AI (Kimi K2.6)",
					"groupHint": "Kimi K2.6",
					"optionKey": "kimiCodeApiKey",
					"cliFlag": "--kimi-code-api-key",
					"cliOption": "--kimi-code-api-key <key>",
					"cliDescription": "Kimi Code API key (subscription)",
					"onboardingScopes": ["text-inference"]
				}]
			}],
			"install": {
				"clawhubSpec": "clawhub:@gabrielvfonseca/kimi-provider",
				"npmSpec": "@gabrielvfonseca/kimi-provider",
				"defaultChoice": "npm",
				"minHostVersion": ">=2026.6.8"
			}
		}
	},
	{
		"name": "@gabrielvfonseca/pixverse-provider",
		"description": "Operator PixVerse video provider plugin",
		"source": "official",
		"kind": "provider",
		"@gabrielvfonseca/operator": {
			"plugin": {
				"id": "pixverse",
				"label": "PixVerse"
			},
			"providers": [{
				"id": "pixverse",
				"name": "PixVerse",
				"docs": "/providers/pixverse",
				"categories": ["cloud", "video"],
				"authChoices": [{
					"method": "api-key",
					"choiceId": "pixverse-api-key",
					"choiceLabel": "PixVerse API key",
					"choiceHint": "Wizard prompts for International or CN endpoint.",
					"groupId": "pixverse",
					"groupLabel": "PixVerse",
					"groupHint": "Video generation",
					"optionKey": "pixverseApiKey",
					"cliFlag": "--pixverse-api-key",
					"cliOption": "--pixverse-api-key <key>",
					"cliDescription": "PixVerse API key",
					"onboardingScopes": ["image-generation"]
				}]
			}],
			"install": {
				"npmSpec": "@gabrielvfonseca/pixverse-provider",
				"defaultChoice": "npm",
				"minHostVersion": ">=2026.5.26"
			}
		}
	},
	{
		"name": "@gabrielvfonseca/qianfan-provider",
		"description": "Operator Qianfan provider plugin.",
		"source": "official",
		"kind": "provider",
		"@gabrielvfonseca/operator": {
			"plugin": {
				"id": "qianfan",
				"label": "Qianfan"
			},
			"providers": [{
				"id": "qianfan",
				"name": "Qianfan",
				"docs": "/providers/qianfan",
				"categories": ["cloud", "llm"],
				"envVars": ["QIANFAN_API_KEY"],
				"authChoices": [{
					"method": "api-key",
					"choiceId": "qianfan-api-key",
					"choiceLabel": "Qianfan API key",
					"groupId": "qianfan",
					"groupLabel": "Qianfan",
					"groupHint": "API key",
					"optionKey": "qianfanApiKey",
					"cliFlag": "--qianfan-api-key",
					"cliOption": "--qianfan-api-key <key>",
					"cliDescription": "QIANFAN API key",
					"onboardingScopes": ["text-inference"]
				}]
			}],
			"install": {
				"clawhubSpec": "clawhub:@gabrielvfonseca/qianfan-provider",
				"npmSpec": "@gabrielvfonseca/qianfan-provider",
				"defaultChoice": "npm",
				"minHostVersion": ">=2026.6.8"
			}
		}
	},
	{
		"name": "@gabrielvfonseca/qwen-provider",
		"description": "Operator Qwen Cloud provider plugin.",
		"source": "official",
		"kind": "provider",
		"@gabrielvfonseca/operator": {
			"plugin": {
				"id": "qwen",
				"label": "Qwen Cloud"
			},
			"providerEndpoints": [{
				"endpointClass": "modelstudio-native",
				"baseUrls": [
					"https://coding-intl.dashscope.aliyuncs.com/v1",
					"https://coding.dashscope.aliyuncs.com/v1",
					"https://dashscope.aliyuncs.com/compatible-mode/v1",
					"https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
					"https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1",
					"https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1"
				]
			}, {
				"endpointClass": "qwen-portal-native",
				"baseUrls": ["https://portal.qwen.ai/v1"]
			}],
			"providers": [
				{
					"id": "qwen",
					"aliases": [
						"qwencloud",
						"modelstudio",
						"dashscope"
					],
					"name": "Qwen Cloud",
					"docs": "/providers/qwen",
					"categories": ["cloud", "llm"],
					"envVars": [
						"QWEN_API_KEY",
						"MODELSTUDIO_API_KEY",
						"DASHSCOPE_API_KEY"
					],
					"authChoices": [
						{
							"method": "standard-api-key-cn",
							"choiceId": "qwen-standard-api-key-cn",
							"deprecatedChoiceIds": ["modelstudio-standard-api-key-cn"],
							"choiceLabel": "Standard API Key for China (pay-as-you-go)",
							"choiceHint": "Endpoint: dashscope.aliyuncs.com",
							"groupId": "qwen",
							"groupLabel": "Qwen Cloud",
							"groupHint": "Standard / Coding Plan (CN / Global) + multimodal roadmap",
							"optionKey": "modelstudioStandardApiKeyCn",
							"cliFlag": "--modelstudio-standard-api-key-cn",
							"cliOption": "--modelstudio-standard-api-key-cn <key>",
							"cliDescription": "Qwen Cloud standard API key (China)",
							"onboardingScopes": ["text-inference"]
						},
						{
							"method": "standard-api-key",
							"choiceId": "qwen-standard-api-key",
							"deprecatedChoiceIds": ["modelstudio-standard-api-key"],
							"choiceLabel": "Standard API Key for Global/Intl (pay-as-you-go)",
							"choiceHint": "Endpoint: dashscope-intl.aliyuncs.com",
							"groupId": "qwen",
							"groupLabel": "Qwen Cloud",
							"groupHint": "Standard / Coding Plan (CN / Global) + multimodal roadmap",
							"optionKey": "modelstudioStandardApiKey",
							"cliFlag": "--modelstudio-standard-api-key",
							"cliOption": "--modelstudio-standard-api-key <key>",
							"cliDescription": "Qwen Cloud standard API key (Global/Intl)",
							"onboardingScopes": ["text-inference"]
						},
						{
							"method": "api-key-cn",
							"choiceId": "qwen-api-key-cn",
							"deprecatedChoiceIds": ["modelstudio-api-key-cn"],
							"choiceLabel": "Coding Plan API Key for China (subscription)",
							"choiceHint": "Endpoint: coding.dashscope.aliyuncs.com",
							"groupId": "qwen",
							"groupLabel": "Qwen Cloud",
							"groupHint": "Standard / Coding Plan (CN / Global) + multimodal roadmap",
							"optionKey": "modelstudioApiKeyCn",
							"cliFlag": "--modelstudio-api-key-cn",
							"cliOption": "--modelstudio-api-key-cn <key>",
							"cliDescription": "Qwen Cloud Coding Plan API key (China)",
							"onboardingScopes": ["text-inference"]
						},
						{
							"method": "api-key",
							"choiceId": "qwen-api-key",
							"deprecatedChoiceIds": ["modelstudio-api-key"],
							"choiceLabel": "Coding Plan API Key for Global/Intl (subscription)",
							"choiceHint": "Endpoint: coding-intl.dashscope.aliyuncs.com",
							"groupId": "qwen",
							"groupLabel": "Qwen Cloud",
							"groupHint": "Standard / Coding Plan (CN / Global) + multimodal roadmap",
							"optionKey": "modelstudioApiKey",
							"cliFlag": "--modelstudio-api-key",
							"cliOption": "--modelstudio-api-key <key>",
							"cliDescription": "Qwen Cloud Coding Plan API key (Global/Intl)",
							"onboardingScopes": ["text-inference"]
						}
					]
				},
				{
					"id": "qwen-oauth",
					"aliases": ["qwen-portal", "qwen-cli"],
					"name": "Qwen Cloud qwen oauth",
					"docs": "/providers/qwen",
					"categories": ["cloud", "llm"],
					"envVars": ["QWEN_API_KEY"],
					"authChoices": [{
						"method": "api-key",
						"choiceId": "qwen-oauth",
						"choiceLabel": "Qwen OAuth",
						"choiceHint": "Portal token for portal.qwen.ai",
						"groupId": "qwen",
						"groupLabel": "Qwen Cloud",
						"groupHint": "Standard / Coding Plan / OAuth",
						"optionKey": "qwenOauthToken",
						"cliFlag": "--qwen-oauth-token",
						"cliOption": "--qwen-oauth-token <token>",
						"cliDescription": "Qwen OAuth token",
						"onboardingScopes": ["text-inference"]
					}]
				},
				{
					"id": "qwen-token-plan",
					"name": "Qwen Token Plan",
					"docs": "/providers/qwen",
					"categories": ["cloud", "llm"],
					"envVars": ["QWEN_TOKEN_PLAN_API_KEY"],
					"authChoices": [{
						"method": "api-key",
						"choiceId": "qwen-token-plan",
						"choiceLabel": "Qwen Token Plan (Global/Intl)",
						"choiceHint": "Endpoint: token-plan.ap-southeast-1.maas.aliyuncs.com",
						"groupId": "qwen",
						"groupLabel": "Qwen Cloud",
						"groupHint": "Standard / Coding Plan / Token Plan / OAuth",
						"optionKey": "qwenTokenPlanApiKey",
						"cliFlag": "--qwen-token-plan-api-key",
						"cliOption": "--qwen-token-plan-api-key <key>",
						"cliDescription": "Qwen Token Plan API key (Global/Intl)",
						"onboardingScopes": ["text-inference"]
					}, {
						"method": "api-key-cn",
						"choiceId": "qwen-token-plan-cn",
						"choiceLabel": "Qwen Token Plan (China)",
						"choiceHint": "Endpoint: token-plan.cn-beijing.maas.aliyuncs.com",
						"groupId": "qwen",
						"groupLabel": "Qwen Cloud",
						"groupHint": "Standard / Coding Plan / Token Plan / OAuth",
						"optionKey": "qwenTokenPlanApiKeyCn",
						"cliFlag": "--qwen-token-plan-api-key-cn",
						"cliOption": "--qwen-token-plan-api-key-cn <key>",
						"cliDescription": "Qwen Token Plan API key (China)",
						"onboardingScopes": ["text-inference"]
					}]
				},
				{
					"id": "bailian-token-plan",
					"name": "Alibaba Token Plan (legacy custom config)",
					"docs": "/providers/qwen",
					"categories": ["cloud", "llm"]
				}
			],
			"contracts": {
				"mediaUnderstandingProviders": ["qwen"],
				"videoGenerationProviders": ["qwen"]
			},
			"install": {
				"clawhubSpec": "clawhub:@gabrielvfonseca/qwen-provider",
				"npmSpec": "@gabrielvfonseca/qwen-provider",
				"defaultChoice": "npm",
				"minHostVersion": ">=2026.6.8"
			}
		}
	},
	{
		"name": "@gabrielvfonseca/fireworks-provider",
		"description": "Operator Fireworks provider plugin",
		"source": "official",
		"kind": "provider",
		"@gabrielvfonseca/operator": {
			"plugin": {
				"id": "fireworks",
				"label": "Fireworks"
			},
			"providers": [{
				"id": "fireworks",
				"aliases": ["fireworks-ai"],
				"name": "Fireworks",
				"docs": "/providers/fireworks",
				"categories": ["cloud", "llm"],
				"envVars": ["FIREWORKS_API_KEY"],
				"authChoices": [{
					"method": "api-key",
					"choiceId": "fireworks-api-key",
					"choiceLabel": "Fireworks API key",
					"choiceHint": "API key",
					"groupId": "fireworks",
					"groupLabel": "Fireworks",
					"groupHint": "API key",
					"optionKey": "fireworksApiKey",
					"cliFlag": "--fireworks-api-key",
					"cliOption": "--fireworks-api-key <key>",
					"cliDescription": "Fireworks API key",
					"onboardingScopes": ["text-inference"]
				}]
			}],
			"install": {
				"clawhubSpec": "clawhub:@gabrielvfonseca/fireworks-provider",
				"npmSpec": "@gabrielvfonseca/fireworks-provider",
				"defaultChoice": "npm",
				"minHostVersion": ">=2026.6.9"
			}
		}
	},
	{
		"name": "@gabrielvfonseca/moonshot-provider",
		"description": "Operator Moonshot provider plugin",
		"source": "official",
		"kind": "provider",
		"@gabrielvfonseca/operator": {
			"plugin": {
				"id": "moonshot",
				"label": "Moonshot"
			},
			"providerEndpoints": [{
				"endpointClass": "moonshot-native",
				"baseUrls": ["https://api.moonshot.ai/v1", "https://api.moonshot.cn/v1"]
			}],
			"providers": [{
				"id": "moonshot",
				"aliases": ["moonshotai", "moonshot-ai"],
				"name": "Moonshot",
				"docs": "/providers/moonshot",
				"categories": ["cloud", "llm"],
				"envVars": ["MOONSHOT_API_KEY", "KIMI_API_KEY"],
				"authChoices": [{
					"method": "api-key",
					"choiceId": "moonshot-api-key",
					"choiceLabel": "Moonshot API key (.ai)",
					"choiceHint": "Kimi K2.6 + Kimi",
					"groupId": "moonshot",
					"groupLabel": "Moonshot AI (Kimi K2.6)",
					"groupHint": "Kimi K2.6",
					"optionKey": "moonshotApiKey",
					"cliFlag": "--moonshot-api-key",
					"cliOption": "--moonshot-api-key <key>",
					"cliDescription": "Moonshot API key",
					"onboardingScopes": ["text-inference"]
				}, {
					"method": "api-key-cn",
					"choiceId": "moonshot-api-key-cn",
					"choiceLabel": "Moonshot API key (.cn)",
					"choiceHint": "Kimi K2.6 + Kimi",
					"groupId": "moonshot",
					"groupLabel": "Moonshot AI (Kimi K2.6)",
					"groupHint": "Kimi K2.6",
					"optionKey": "moonshotApiKey",
					"cliFlag": "--moonshot-api-key",
					"cliOption": "--moonshot-api-key <key>",
					"cliDescription": "Moonshot API key",
					"onboardingScopes": ["text-inference"]
				}]
			}],
			"contracts": {
				"mediaUnderstandingProviders": ["moonshot"],
				"webSearchProviders": ["kimi"]
			},
			"webSearchProviders": [{
				"id": "kimi",
				"label": "Kimi (Moonshot)",
				"hint": "Requires Moonshot / Kimi API key · Moonshot web search",
				"onboardingScopes": ["text-inference"],
				"credentialLabel": "Moonshot / Kimi API key",
				"envVars": ["KIMI_API_KEY", "MOONSHOT_API_KEY"],
				"placeholder": "sk-...",
				"signupUrl": "https://platform.moonshot.cn/",
				"docsUrl": "https://docs.operator.ai/tools/web",
				"credentialPath": "plugins.entries.moonshot.config.webSearch.apiKey",
				"autoDetectOrder": 40
			}],
			"install": {
				"clawhubSpec": "clawhub:@gabrielvfonseca/moonshot-provider",
				"npmSpec": "@gabrielvfonseca/moonshot-provider",
				"defaultChoice": "npm",
				"minHostVersion": ">=2026.6.9"
			}
		}
	},
	{
		"name": "@gabrielvfonseca/tencent-provider",
		"description": "Operator Tencent Cloud provider plugin (TokenHub + Token Plan)",
		"source": "official",
		"kind": "provider",
		"@gabrielvfonseca/operator": {
			"plugin": {
				"id": "tencent",
				"label": "Tencent Cloud"
			},
			"providers": [{
				"id": "tencent-tokenhub",
				"name": "Tencent TokenHub",
				"docs": "/providers/tencent",
				"categories": ["cloud", "llm"],
				"envVars": ["TOKENHUB_API_KEY"],
				"authChoices": [{
					"method": "api-key",
					"choiceId": "tokenhub-api-key",
					"choiceLabel": "Tencent TokenHub",
					"choiceHint": "Hy via Tencent TokenHub Gateway",
					"groupId": "tencent",
					"groupLabel": "Tencent Cloud",
					"groupHint": "Tencent TokenHub",
					"optionKey": "tokenhubApiKey",
					"cliFlag": "--tokenhub-api-key",
					"cliOption": "--tokenhub-api-key <key>",
					"cliDescription": "Tencent TokenHub API key",
					"onboardingScopes": ["text-inference"]
				}]
			}, {
				"id": "tencent-tokenplan",
				"name": "Tencent TokenPlan",
				"docs": "/providers/tencent",
				"categories": ["cloud", "llm"],
				"envVars": ["TOKENPLAN_API_KEY"],
				"authChoices": [{
					"method": "api-key",
					"choiceId": "tokenplan-api-key",
					"choiceLabel": "Tencent TokenPlan",
					"choiceHint": "Hy via Tencent TokenPlan Gateway",
					"groupId": "tencent",
					"groupLabel": "Tencent Cloud",
					"groupHint": "Tencent TokenPlan",
					"optionKey": "tokenplanApiKey",
					"cliFlag": "--tokenplan-api-key",
					"cliOption": "--tokenplan-api-key <key>",
					"cliDescription": "Tencent TokenPlan API key",
					"onboardingScopes": ["text-inference"]
				}]
			}],
			"install": {
				"clawhubSpec": "clawhub:@gabrielvfonseca/tencent-provider",
				"npmSpec": "@gabrielvfonseca/tencent-provider",
				"defaultChoice": "npm",
				"minHostVersion": ">=2026.6.9"
			}
		}
	},
	{
		"name": "@gabrielvfonseca/venice-provider",
		"description": "Operator Venice provider plugin",
		"source": "official",
		"kind": "provider",
		"@gabrielvfonseca/operator": {
			"plugin": {
				"id": "venice",
				"label": "Venice"
			},
			"providers": [{
				"id": "venice",
				"name": "Venice",
				"docs": "/providers/venice",
				"categories": ["cloud", "llm"],
				"envVars": ["VENICE_API_KEY"],
				"authChoices": [{
					"method": "api-key",
					"choiceId": "venice-api-key",
					"choiceLabel": "Venice AI API key",
					"choiceHint": "Privacy-focused (uncensored models)",
					"groupId": "venice",
					"groupLabel": "Venice AI",
					"groupHint": "Privacy-focused (uncensored models)",
					"optionKey": "veniceApiKey",
					"cliFlag": "--venice-api-key",
					"cliOption": "--venice-api-key <key>",
					"cliDescription": "Venice API key",
					"onboardingScopes": ["text-inference"]
				}]
			}],
			"install": {
				"clawhubSpec": "clawhub:@gabrielvfonseca/venice-provider",
				"npmSpec": "@gabrielvfonseca/venice-provider",
				"defaultChoice": "npm",
				"minHostVersion": ">=2026.6.9"
			}
		}
	},
	{
		"name": "@gabrielvfonseca/vercel-ai-gateway-provider",
		"description": "Operator Vercel AI Gateway provider plugin",
		"source": "official",
		"kind": "provider",
		"@gabrielvfonseca/operator": {
			"plugin": {
				"id": "vercel-ai-gateway",
				"label": "Vercel AI Gateway"
			},
			"providers": [{
				"id": "vercel-ai-gateway",
				"name": "Vercel AI Gateway",
				"docs": "/providers/vercel-ai-gateway",
				"categories": ["cloud", "llm"],
				"envVars": ["AI_GATEWAY_API_KEY"],
				"authChoices": [{
					"method": "api-key",
					"choiceId": "ai-gateway-api-key",
					"choiceLabel": "Vercel AI Gateway API key",
					"choiceHint": "API key",
					"groupId": "ai-gateway",
					"groupLabel": "Vercel AI Gateway",
					"groupHint": "API key",
					"optionKey": "aiGatewayApiKey",
					"cliFlag": "--ai-gateway-api-key",
					"cliOption": "--ai-gateway-api-key <key>",
					"cliDescription": "Vercel AI Gateway API key",
					"onboardingScopes": ["text-inference"]
				}]
			}],
			"install": {
				"clawhubSpec": "clawhub:@gabrielvfonseca/vercel-ai-gateway-provider",
				"npmSpec": "@gabrielvfonseca/vercel-ai-gateway-provider",
				"defaultChoice": "npm",
				"minHostVersion": ">=2026.6.9"
			}
		}
	},
	{
		"name": "@gabrielvfonseca/zai-provider",
		"description": "Operator Z.AI provider plugin",
		"source": "official",
		"kind": "provider",
		"@gabrielvfonseca/operator": {
			"plugin": {
				"id": "zai",
				"label": "Z.AI"
			},
			"providerEndpoints": [{
				"endpointClass": "zai-native",
				"hosts": ["api.z.ai"]
			}],
			"providers": [{
				"id": "zai",
				"aliases": ["z-ai", "z.ai"],
				"name": "Z.AI",
				"docs": "/providers/zai",
				"categories": ["cloud", "llm"],
				"envVars": ["ZAI_API_KEY", "Z_AI_API_KEY"],
				"authChoices": [
					{
						"method": "api-key",
						"choiceId": "zai-api-key",
						"choiceLabel": "Z.AI API key",
						"groupId": "zai",
						"groupLabel": "Z.AI",
						"groupHint": "GLM Coding Plan / Global / CN",
						"optionKey": "zaiApiKey",
						"cliFlag": "--zai-api-key",
						"cliOption": "--zai-api-key <key>",
						"cliDescription": "Z.AI API key",
						"onboardingScopes": ["text-inference"]
					},
					{
						"method": "coding-global",
						"choiceId": "zai-coding-global",
						"choiceLabel": "Coding-Plan-Global",
						"choiceHint": "GLM Coding Plan Global (api.z.ai)",
						"groupId": "zai",
						"groupLabel": "Z.AI",
						"groupHint": "GLM Coding Plan / Global / CN",
						"optionKey": "zaiApiKey",
						"cliFlag": "--zai-api-key",
						"cliOption": "--zai-api-key <key>",
						"cliDescription": "Z.AI API key",
						"onboardingScopes": ["text-inference"]
					},
					{
						"method": "coding-cn",
						"choiceId": "zai-coding-cn",
						"choiceLabel": "Coding-Plan-CN",
						"choiceHint": "GLM Coding Plan CN (open.bigmodel.cn)",
						"groupId": "zai",
						"groupLabel": "Z.AI",
						"groupHint": "GLM Coding Plan / Global / CN",
						"optionKey": "zaiApiKey",
						"cliFlag": "--zai-api-key",
						"cliOption": "--zai-api-key <key>",
						"cliDescription": "Z.AI API key",
						"onboardingScopes": ["text-inference"]
					},
					{
						"method": "global",
						"choiceId": "zai-global",
						"choiceLabel": "Global",
						"choiceHint": "Z.AI Global (api.z.ai)",
						"groupId": "zai",
						"groupLabel": "Z.AI",
						"groupHint": "GLM Coding Plan / Global / CN",
						"optionKey": "zaiApiKey",
						"cliFlag": "--zai-api-key",
						"cliOption": "--zai-api-key <key>",
						"cliDescription": "Z.AI API key",
						"onboardingScopes": ["text-inference"]
					},
					{
						"method": "cn",
						"choiceId": "zai-cn",
						"choiceLabel": "CN",
						"choiceHint": "Z.AI CN (open.bigmodel.cn)",
						"groupId": "zai",
						"groupLabel": "Z.AI",
						"groupHint": "GLM Coding Plan / Global / CN",
						"optionKey": "zaiApiKey",
						"cliFlag": "--zai-api-key",
						"cliOption": "--zai-api-key <key>",
						"cliDescription": "Z.AI API key",
						"onboardingScopes": ["text-inference"]
					}
				]
			}],
			"contracts": { "mediaUnderstandingProviders": ["zai"] },
			"install": {
				"clawhubSpec": "clawhub:@gabrielvfonseca/zai-provider",
				"npmSpec": "@gabrielvfonseca/zai-provider",
				"defaultChoice": "npm",
				"minHostVersion": ">=2026.6.9"
			}
		}
	},
	{
		"name": "@gabrielvfonseca/stepfun-provider",
		"description": "Operator StepFun provider plugin.",
		"source": "official",
		"kind": "provider",
		"@gabrielvfonseca/operator": {
			"plugin": {
				"id": "stepfun",
				"label": "StepFun"
			},
			"providers": [{
				"id": "stepfun",
				"name": "StepFun",
				"docs": "/providers/stepfun",
				"categories": ["cloud", "llm"],
				"envVars": ["STEPFUN_API_KEY"],
				"authChoices": [{
					"method": "standard-api-key-cn",
					"choiceId": "stepfun-standard-api-key-cn",
					"choiceLabel": "StepFun Standard API key (China)",
					"choiceHint": "Endpoint: api.stepfun.com/v1",
					"groupId": "stepfun",
					"groupLabel": "StepFun",
					"groupHint": "Standard / Step Plan (China / Global)",
					"optionKey": "stepfunApiKey",
					"cliFlag": "--stepfun-api-key",
					"cliOption": "--stepfun-api-key <key>",
					"cliDescription": "StepFun API key",
					"onboardingScopes": ["text-inference"]
				}, {
					"method": "standard-api-key-intl",
					"choiceId": "stepfun-standard-api-key-intl",
					"choiceLabel": "StepFun Standard API key (Global/Intl)",
					"choiceHint": "Endpoint: api.stepfun.ai/v1",
					"groupId": "stepfun",
					"groupLabel": "StepFun",
					"groupHint": "Standard / Step Plan (China / Global)",
					"optionKey": "stepfunApiKey",
					"cliFlag": "--stepfun-api-key",
					"cliOption": "--stepfun-api-key <key>",
					"cliDescription": "StepFun API key",
					"onboardingScopes": ["text-inference"]
				}]
			}, {
				"id": "stepfun-plan",
				"name": "StepFun stepfun plan",
				"docs": "/providers/stepfun",
				"categories": ["cloud", "llm"],
				"envVars": ["STEPFUN_API_KEY"],
				"authChoices": [{
					"method": "plan-api-key-cn",
					"choiceId": "stepfun-plan-api-key-cn",
					"choiceLabel": "StepFun Step Plan API key (China)",
					"choiceHint": "Endpoint: api.stepfun.com/step_plan/v1",
					"groupId": "stepfun",
					"groupLabel": "StepFun",
					"groupHint": "Standard / Step Plan (China / Global)",
					"optionKey": "stepfunApiKey",
					"cliFlag": "--stepfun-api-key",
					"cliOption": "--stepfun-api-key <key>",
					"cliDescription": "StepFun API key",
					"onboardingScopes": ["text-inference"]
				}, {
					"method": "plan-api-key-intl",
					"choiceId": "stepfun-plan-api-key-intl",
					"choiceLabel": "StepFun Step Plan API key (Global/Intl)",
					"choiceHint": "Endpoint: api.stepfun.ai/step_plan/v1",
					"groupId": "stepfun",
					"groupLabel": "StepFun",
					"groupHint": "Standard / Step Plan (China / Global)",
					"optionKey": "stepfunApiKey",
					"cliFlag": "--stepfun-api-key",
					"cliOption": "--stepfun-api-key <key>",
					"cliDescription": "StepFun API key",
					"onboardingScopes": ["text-inference"]
				}]
			}],
			"install": {
				"clawhubSpec": "clawhub:@gabrielvfonseca/stepfun-provider",
				"npmSpec": "@gabrielvfonseca/stepfun-provider",
				"defaultChoice": "npm",
				"minHostVersion": ">=2026.6.9"
			}
		}
	}
] };
//#endregion
//#region src/plugins/official-external-plugin-bundled-catalogs.ts
const BUNDLED_OFFICIAL_EXTERNAL_PLUGIN_CATALOGS = [
	official_external_channel_catalog_default,
	official_external_provider_catalog_default,
	official_external_plugin_catalog_default
];
const BUNDLED_OFFICIAL_EXTERNAL_PLUGIN_CATALOG_ENTRIES = [
	...official_external_channel_catalog_default.entries,
	...official_external_provider_catalog_default.entries,
	...official_external_plugin_catalog_default.entries
];
//#endregion
Object.defineProperty(exports, "BUNDLED_OFFICIAL_EXTERNAL_PLUGIN_CATALOGS", {
	enumerable: true,
	get: function() {
		return BUNDLED_OFFICIAL_EXTERNAL_PLUGIN_CATALOGS;
	}
});
Object.defineProperty(exports, "BUNDLED_OFFICIAL_EXTERNAL_PLUGIN_CATALOG_ENTRIES", {
	enumerable: true,
	get: function() {
		return BUNDLED_OFFICIAL_EXTERNAL_PLUGIN_CATALOG_ENTRIES;
	}
});
Object.defineProperty(exports, "official_external_provider_catalog_default", {
	enumerable: true,
	get: function() {
		return official_external_provider_catalog_default;
	}
});
