import { parseSqlSchema } from './lib/utils/sql-parser';

const sql = `
CREATE TABLE [dbo].[mzp_dummy_agent](
	[agentCode] [nvarchar](50) NOT NULL,
	[agentName] [nvarchar](50) NULL,
	[agentStatus] [nvarchar](50) NULL,
	[joinDate] [date] NULL,
	[resignDate] [date] NULL,
	[additional_info] [nvarchar](max) NULL
) ON [PRIMARY]
GO

CREATE TABLE [dbo].[users] (
  id int,
  name varchar(50)
);
`;

console.log(JSON.stringify(parseSqlSchema(sql), null, 2));
