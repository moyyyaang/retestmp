// ===== 웹앱 기본 설정 (보안 강화) =====
function doGet() {
  try {
    // 실제 사용자 이메일 가져오기
    const userEmail = Session.getActiveUser().getEmail();
    
    // 로그 기록 (디버깅용)
    console.log('접속 시도:', userEmail);
    
    // 이메일이 없거나 빈 문자열인 경우
    if (!userEmail || userEmail === '') {
      return HtmlService.createHtmlOutput(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>인증 필요</title>
        </head>
        <body style="background: #0f0f0f; color: #f1f1f1; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
          <div style="text-align: center; background: #181818; padding: 60px; border-radius: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.5);">
            <div style="font-size: 80px; margin-bottom: 30px;">🔒</div>
            <h1 style="font-size: 32px; margin-bottom: 20px;">인증 필요</h1>
            <p style="font-size: 18px; color: #aaa;">@awesomeent.kr 계정으로 로그인해주세요.</p>
            <p style="margin-top: 30px; color: #666; font-size: 14px;">구글 계정으로 로그인 후 다시 시도해주세요.</p>
          </div>
        </body>
        </html>
      `);
    }
    
    // 도메인 검증
    if (!userEmail.endsWith('@awesomeent.kr')) {
      return HtmlService.createHtmlOutput(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>접근 거부</title>
        </head>
        <body style="background: #0f0f0f; color: #f1f1f1; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
          <div style="text-align: center; background: #181818; padding: 60px; border-radius: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.5);">
            <div style="font-size: 80px; margin-bottom: 30px;">🚫</div>
            <h1 style="font-size: 32px; margin-bottom: 20px; color: #ff6b6b;">접근 거부</h1>
            <p style="font-size: 18px; color: #aaa;">@awesomeent.kr 도메인 사용자만 접근 가능합니다.</p>
            <p style="margin-top: 20px; color: #666; font-size: 14px;">현재 로그인: ${userEmail}</p>
          </div>
        </body>
        </html>
      `);
    }
    
    // 사용자 권한 확인
    const userInfo = getUserPermission(userEmail);
    
    // 권한이 없는 경우
    if (!userInfo || userInfo.active !== 'Y') {
      const noAccessTemplate = HtmlService.createTemplateFromFile('noAccess');
      noAccessTemplate.userEmail = userEmail;
      return noAccessTemplate.evaluate()
          .setTitle('접근 권한 없음')
          .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }
    
    // 권한이 있는 경우
    const template = HtmlService.createTemplateFromFile('index');
    template.userEmail = userEmail;
    template.userInfo = userInfo;
    
    // 접속 로그 기록
    try {
      logAction('시스템 접속', `권한레벨: ${userInfo.level}, 부서: ${userInfo.department}`);
    } catch (e) {
      console.error('로그 기록 실패:', e);
    }
    
    return template.evaluate()
        .setTitle('성과 평가 시스템')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  } catch (error) {
    console.error('doGet 오류:', error);
    return HtmlService.createHtmlOutput(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>시스템 오류</title>
      </head>
      <body style="background: #0f0f0f; color: #f1f1f1; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; font-family: Arial;">
        <div style="text-align: center; background: #181818; padding: 60px; border-radius: 20px;">
          <div style="font-size: 80px; margin-bottom: 30px;">⚠️</div>
          <h1 style="font-size: 32px; margin-bottom: 20px;">시스템 오류</h1>
          <p style="font-size: 18px; color: #aaa;">일시적인 오류가 발생했습니다.</p>
          <p style="margin-top: 20px; color: #666;">관리자에게 문의하세요: admin@awesomeent.kr</p>
        </div>
      </body>
      </html>
    `);
  }
}

// HTML 파일 include 함수
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ===== 스프레드시트 설정 =====
const SPREADSHEET_ID = '1VABgBdmOYMx6gpT0zVpy3B9IIzMKjBj57cUQ5E2SKAo'; // 여기에 구글 시트 ID를 넣으세요
const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

// 시트 이름 상수
const SHEET_NAMES = {
  TEAMS: '팀정보',
  MEMBERS: '팀원정보',
  CHANNELS: '채널정보',
  MEMBER_CHANNEL_MAP: '팀원채널매핑',
  TEAMLEADS: '팀장정보',
  EVAL_INFO: '평가정보',
  FIRST_EVAL: '1차평가',
  SECOND_EVAL: '2차평가',
  FINAL_EVAL: '최종평가',
  USER_PERMISSIONS: '사용자권한',
  ACTION_LOG: '액션로그'
};

// ===== 시트 초기화 함수 =====
function initializeSheets() {
  // 팀정보 시트
  let teamSheet = ss.getSheetByName(SHEET_NAMES.TEAMS);
  if (!teamSheet) {
    teamSheet = ss.insertSheet(SHEET_NAMES.TEAMS);
    teamSheet.getRange(1, 1, 1, 2).setValues([['팀ID', '팀명']]);
    const teams = [
      ['team1', '스튜디오 1팀'],
      ['team2', '스튜디오 2팀'],
      ['team3', '스튜디오 3팀'],
      ['team4', '스튜디오 4팀'],
      ['team5', '스튜디오 5팀']
    ];
    teamSheet.getRange(2, 1, teams.length, 2).setValues(teams);
  }
  
  // 팀원정보 시트
  let memberSheet = ss.getSheetByName(SHEET_NAMES.MEMBERS);
  if (!memberSheet) {
    memberSheet = ss.insertSheet(SHEET_NAMES.MEMBERS);
    memberSheet.getRange(1, 1, 1, 4).setValues([['팀원ID', '팀원명', '소속팀ID', '활성상태']]);
    const members = [
      ['M001', '김철수', 'team1', 'Y'],
      ['M002', '이영희', 'team1', 'Y'],
      ['M003', '박민수', 'team1', 'Y'],
      ['M004', '정수진', 'team2', 'Y'],
      ['M005', '최동현', 'team2', 'Y']
    ];
    memberSheet.getRange(2, 1, members.length, 4).setValues(members);
  }
  
  // 채널정보 시트
  let channelSheet = ss.getSheetByName(SHEET_NAMES.CHANNELS);
  if (!channelSheet) {
    channelSheet = ss.insertSheet(SHEET_NAMES.CHANNELS);
    channelSheet.getRange(1, 1, 1, 4).setValues([['채널ID', '채널명', '소속팀ID', '활성상태']]);
    const channels = [
      ['CH001', '과학드림', 'team1', 'Y'],
      ['CH002', '지식인사이드', 'team1', 'Y'],
      ['CH003', '비즈니스워치', 'team2', 'Y']
    ];
    channelSheet.getRange(2, 1, channels.length, 4).setValues(channels);
  }
  
  // 팀원채널매핑 시트
  let mapSheet = ss.getSheetByName(SHEET_NAMES.MEMBER_CHANNEL_MAP);
  if (!mapSheet) {
    mapSheet = ss.insertSheet(SHEET_NAMES.MEMBER_CHANNEL_MAP);
    mapSheet.getRange(1, 1, 1, 3).setValues([['팀원ID', '채널ID', '활성상태']]);
    const mappings = [
      ['M001', 'CH001', 'Y'],
      ['M001', 'CH002', 'Y'],
      ['M002', 'CH001', 'Y'],
      ['M003', 'CH002', 'Y'],
      ['M004', 'CH003', 'Y'],
      ['M005', 'CH003', 'Y']
    ];
    mapSheet.getRange(2, 1, mappings.length, 3).setValues(mappings);
  }
  
  // 팀장정보 시트
  let teamleadSheet = ss.getSheetByName(SHEET_NAMES.TEAMLEADS);
  if (!teamleadSheet) {
    teamleadSheet = ss.insertSheet(SHEET_NAMES.TEAMLEADS);
    teamleadSheet.getRange(1, 1, 1, 5).setValues([['팀장ID', '팀장명', '담당팀ID', '이메일', '활성상태']]);
    const teamleads = [
      ['TL001', '김팀장', 'team1', 'teamlead1@awesomeent.kr', 'Y'],
      ['TL002', '이팀장', 'team2', 'teamlead2@awesomeent.kr', 'Y'],
      ['TL003', '박팀장', 'team3', 'teamlead3@awesomeent.kr', 'Y'],
      ['TL004', '최팀장', 'team4', 'teamlead4@awesomeent.kr', 'Y'],
      ['TL005', '정팀장', 'team5', 'teamlead5@awesomeent.kr', 'Y']
    ];
    teamleadSheet.getRange(2, 1, teamleads.length, 5).setValues(teamleads);
  }
  
  // 평가정보 시트
  let evalInfoSheet = ss.getSheetByName(SHEET_NAMES.EVAL_INFO);
  if (!evalInfoSheet) {
    evalInfoSheet = ss.insertSheet(SHEET_NAMES.EVAL_INFO);
    evalInfoSheet.getRange(1, 1, 1, 6).setValues([['평가ID', '평가월', '팀장ID', '팀장명', '평가단계', '최종수정일시']]);
  }
  
  // 1차 평가 시트 - 채널 코멘트 컬럼 추가
  let firstEvalSheet = ss.getSheetByName(SHEET_NAMES.FIRST_EVAL);
  if (!firstEvalSheet) {
    firstEvalSheet = ss.insertSheet(SHEET_NAMES.FIRST_EVAL);
    firstEvalSheet.getRange(1, 1, 1, 12).setValues([['평가월', '채널ID', '채널명', '팀원ID', '팀원명', '팀명', '투입MM', '1차기여도', '핵심성과', '1차코멘트', '평가자ID', '채널코멘트']]);
  }
  
  // 2차 평가 시트 - 채널 코멘트 컬럼 추가
  let secondEvalSheet = ss.getSheetByName(SHEET_NAMES.SECOND_EVAL);
  if (!secondEvalSheet) {
    secondEvalSheet = ss.insertSheet(SHEET_NAMES.SECOND_EVAL);
    secondEvalSheet.getRange(1, 1, 1, 13).setValues([['평가월', '채널ID', '채널명', '팀원ID', '팀원명', '팀명', '투입MM', '1차기여도', '2차기여도', '핵심성과', '1차코멘트', '2차코멘트', '채널코멘트']]);
  }
  
  let finalEvalSheet = ss.getSheetByName(SHEET_NAMES.FINAL_EVAL);
  if (!finalEvalSheet) {
    finalEvalSheet = ss.insertSheet(SHEET_NAMES.FINAL_EVAL);
    finalEvalSheet.getRange(1, 1, 1, 13).setValues([['평가월', '채널ID', '채널명', '팀원ID', '팀원명', '팀명', '2차기여도', '1차성과금총액', '팀장성과율', '2차성과금(배분대상)', '기여도성과금', '실지급성과금', '최종확정일시']]);
  }
  
  // 사용자권한 시트
  let permissionSheet = ss.getSheetByName(SHEET_NAMES.USER_PERMISSIONS);
  if (!permissionSheet) {
    permissionSheet = ss.insertSheet(SHEET_NAMES.USER_PERMISSIONS);
    permissionSheet.getRange(1, 1, 1, 6).setValues([['이메일', '이름', '부서', '권한레벨', '활성상태', '등록일시']]);
    
    // 샘플 권한 데이터
    const samplePermissions = [
      ['admin@awesomeent.kr', '관리자', '경영지원팀', 3, 'Y', new Date().toLocaleString('ko-KR')],
      ['teamlead1@awesomeent.kr', '김팀장', '스튜디오 1팀', 1, 'Y', new Date().toLocaleString('ko-KR')],
      ['manager@awesomeent.kr', '이부장', '콘텐츠사업부', 2, 'Y', new Date().toLocaleString('ko-KR')]
    ];
    permissionSheet.getRange(2, 1, samplePermissions.length, 6).setValues(samplePermissions);
  }
  
  // 액션로그 시트
  let actionLogSheet = ss.getSheetByName(SHEET_NAMES.ACTION_LOG);
  if (!actionLogSheet) {
    actionLogSheet = ss.insertSheet(SHEET_NAMES.ACTION_LOG);
    actionLogSheet.getRange(1, 1, 1, 5).setValues([['일시', '사용자', '액션', '상세내용', 'IP주소']]);
  }
}

// ===== 데이터 조회 함수들 =====
function getTeamsData() {
  try {
    const sheet = ss.getSheetByName(SHEET_NAMES.TEAMS);
    const data = sheet.getDataRange().getValues();
    const teams = {};
    
    for (let i = 1; i < data.length; i++) {
      const [teamId, teamName] = data[i];
      teams[teamId] = { id: teamId, name: teamName };
    }
    
    return teams;
  } catch (error) {
    console.error('팀 데이터 가져오기 오류:', error);
    return {};
  }
}

function getMembersData() {
  try {
    const sheet = ss.getSheetByName(SHEET_NAMES.MEMBERS);
    const data = sheet.getDataRange().getValues();
    const members = [];
    
    for (let i = 1; i < data.length; i++) {
      const [memberId, memberName, teamId, active] = data[i];
      if (active === 'Y') {
        members.push({
          id: memberId,
          name: memberName,
          teamId: teamId,
          rowIndex: i + 1
        });
      }
    }
    
    return members;
  } catch (error) {
    console.error('팀원 데이터 가져오기 오류:', error);
    return [];
  }
}

function getChannelsData() {
  try {
    const sheet = ss.getSheetByName(SHEET_NAMES.CHANNELS);
    const data = sheet.getDataRange().getValues();
    const channels = [];
    
    for (let i = 1; i < data.length; i++) {
      const [channelId, channelName, teamId, active] = data[i];
      if (active === 'Y') {
        channels.push({
          id: channelId,
          name: channelName,
          teamId: teamId,
          rowIndex: i + 1
        });
      }
    }
    
    return channels;
  } catch (error) {
    console.error('채널 데이터 가져오기 오류:', error);
    return [];
  }
}

function getTeamLeadsData() {
  try {
    const sheet = ss.getSheetByName(SHEET_NAMES.TEAMLEADS);
    const data = sheet.getDataRange().getValues();
    const teamleads = [];
    
    for (let i = 1; i < data.length; i++) {
      const [teamleadId, teamleadName, teamId, email, active] = data[i];
      if (active === 'Y') {
        teamleads.push({
          id: teamleadId,
          name: teamleadName,
          teamId: teamId,
          email: email || ''
        });
      }
    }
    
    return teamleads;
  } catch (error) {
    console.error('팀장 데이터 가져오기 오류:', error);
    return [];
  }
}

function getChannelMembersData(channelId) {
  try {
    const mapSheet = ss.getSheetByName(SHEET_NAMES.MEMBER_CHANNEL_MAP);
    const memberSheet = ss.getSheetByName(SHEET_NAMES.MEMBERS);
    const teamSheet = ss.getSheetByName(SHEET_NAMES.TEAMS);
    
    const mapData = mapSheet.getDataRange().getValues();
    const memberData = memberSheet.getDataRange().getValues();
    const teamData = teamSheet.getDataRange().getValues();
    
    const teams = {};
    for (let i = 1; i < teamData.length; i++) {
      teams[teamData[i][0]] = teamData[i][1];
    }
    
    const members = {};
    for (let i = 1; i < memberData.length; i++) {
      if (memberData[i][3] === 'Y') {
        members[memberData[i][0]] = {
          name: memberData[i][1],
          teamId: memberData[i][2],
          teamName: teams[memberData[i][2]]
        };
      }
    }
    
    const channelMembers = [];
    for (let i = 1; i < mapData.length; i++) {
      if (mapData[i][1] === channelId && mapData[i][2] === 'Y') {
        const memberId = mapData[i][0];
        if (members[memberId]) {
          channelMembers.push({
            id: memberId,
            name: members[memberId].name,
            teamId: members[memberId].teamId,
            teamName: members[memberId].teamName
          });
        }
      }
    }
    
    return channelMembers;
  } catch (error) {
    console.error('채널 멤버 데이터 가져오기 오류:', error);
    return [];
  }
}

// ===== 권한 관리 함수들 (수정) =====
function getUserPermission(email) {
  try {
    const sheet = ss.getSheetByName(SHEET_NAMES.USER_PERMISSIONS);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === email) {
        // 팀장 정보도 함께 가져오기
        const teamleadInfo = getTeamleadByEmail(email);
        
        return {
          email: data[i][0],
          name: data[i][1],
          department: data[i][2],
          level: data[i][3],
          active: data[i][4],
          teamId: teamleadInfo ? teamleadInfo.teamId : null,
          teamleadId: teamleadInfo ? teamleadInfo.id : null
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('권한 조회 오류:', error);
    return null;
  }
}

// 이메일로 팀장 정보 가져오기
function getTeamleadByEmail(email) {
  try {
    const sheet = ss.getSheetByName(SHEET_NAMES.TEAMLEADS);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][3] === email && data[i][4] === 'Y') {
        return {
          id: data[i][0],
          name: data[i][1],
          teamId: data[i][2],
          email: data[i][3]
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('팀장 정보 조회 오류:', error);
    return null;
  }
}

// ===== 보안 강화된 checkPermission 함수 =====
function checkPermission(requiredLevel, teamId = null) {
  const userEmail = Session.getActiveUser().getEmail();
  
  if (!userEmail || !userEmail.endsWith('@awesomeent.kr')) {
    throw new Error('유효하지 않은 사용자입니다.');
  }
  
  const userInfo = getUserPermission(userEmail);
  
  if (!userInfo || userInfo.active !== 'Y') {
    throw new Error('접근 권한이 없습니다.');
  }
  
  if (userInfo.level < requiredLevel) {
    throw new Error('권한이 부족합니다.');
  }
  
  // 팀 권한 체크 (레벨 1인 경우)
  if (userInfo.level === 1 && teamId && userInfo.teamId !== teamId) {
    throw new Error('해당 팀의 데이터에 접근할 권한이 없습니다.');
  }
  
  return userInfo;
}

// ===== 팀별 데이터 필터링 함수들 =====
function getTeamChannels(teamId) {
  try {
    const channels = getChannelsData();
    return channels.filter(channel => channel.teamId === teamId);
  } catch (error) {
    console.error('팀 채널 조회 오류:', error);
    return [];
  }
}

function getTeamMembers(teamId) {
  try {
    const members = getMembersData();
    return members.filter(member => member.teamId === teamId);
  } catch (error) {
    console.error('팀 멤버 조회 오류:', error);
    return [];
  }
}

// ===== 팀원 추가/제거 함수 =====
function addMemberToChannel(channelId, memberId) {
  try {
    const mapSheet = ss.getSheetByName(SHEET_NAMES.MEMBER_CHANNEL_MAP);
    const data = mapSheet.getDataRange().getValues();
    
    // 이미 있는지 확인
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === memberId && data[i][1] === channelId) {
        if (data[i][2] === 'N') {
          // 비활성화된 매핑이면 활성화
          mapSheet.getRange(i + 1, 3).setValue('Y');
          return { success: true, message: '팀원이 추가되었습니다.' };
        } else {
          return { success: false, message: '이미 추가된 팀원입니다.' };
        }
      }
    }
    
    // 새로 추가
    mapSheet.appendRow([memberId, channelId, 'Y']);
    return { success: true, message: '팀원이 추가되었습니다.' };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

function removeMemberFromChannel(channelId, memberId) {
  try {
    const mapSheet = ss.getSheetByName(SHEET_NAMES.MEMBER_CHANNEL_MAP);
    const data = mapSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === memberId && data[i][1] === channelId && data[i][2] === 'Y') {
        mapSheet.getRange(i + 1, 3).setValue('N');
        return { success: true, message: '팀원이 제거되었습니다.' };
      }
    }
    
    return { success: false, message: '해당 팀원을 찾을 수 없습니다.' };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

// ===== 팀별 멤버 조회 =====
function getTeamMembersData(teamId) {
  try {
    const members = getMembersData();
    return members.filter(m => m.teamId === teamId);
  } catch (error) {
    console.error('팀 멤버 조회 오류:', error);
    return [];
  }
}

// ===== 평가 정보 관리 =====
function getEvaluationInfo(evalMonth, teamleadId) {
  try {
    const sheet = ss.getSheetByName(SHEET_NAMES.EVAL_INFO);
    const data = sheet.getDataRange().getValues();
    
    const evalMonthStr = String(evalMonth);
    
    for (let i = data.length - 1; i > 0; i--) {
      if (String(data[i][1]) === evalMonthStr && data[i][2] === teamleadId) {
        return {
          evalId: data[i][0],
          evalMonth: data[i][1],
          teamleadId: data[i][2],
          teamleadName: data[i][3],
          evalStage: data[i][4],
          lastModified: data[i][5]
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('평가 정보 조회 오류:', error);
    return null;
  }
}

function saveEvaluationInfo(evalMonth, teamleadId, teamleadName, evalStage) {
  try {
    const sheet = ss.getSheetByName(SHEET_NAMES.EVAL_INFO);
    const timestamp = new Date().toLocaleString('ko-KR');
    const evalId = 'EV' + new Date().getTime();
    
    const evalMonthStr = String(evalMonth);
    
    const data = sheet.getDataRange().getValues();
    let rowToUpdate = -1;
    
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][1]) === evalMonthStr && data[i][2] === teamleadId) {
        rowToUpdate = i + 1;
        break;
      }
    }
    
    if (rowToUpdate > 0) {
      sheet.getRange(rowToUpdate, 5, 1, 2).setValues([[evalStage, timestamp]]);
    } else {
      sheet.appendRow([evalId, evalMonthStr, teamleadId, teamleadName, evalStage, timestamp]);
    }
    
    return { success: true };
  } catch (error) {
    console.error('평가 정보 저장 오류:', error);
    return { success: false, message: error.toString() };
  }
}

// ===== 기존 평가 데이터 조회 (수정 모드용) =====
function getExistingFirstEvaluation(channelId, evalMonth) {
  try {
    const sheet = ss.getSheetByName(SHEET_NAMES.FIRST_EVAL);
    const data = sheet.getDataRange().getValues();
    
    const evalMonthStr = String(evalMonth);
    
    const evaluations = {};
    let channelComment = '';
    
    for (let i = 1; i < data.length; i++) {
      const [month, chId, channelName, memberId, memberName, teamName, mm, contribution1, achievement, comment1, evaluatorId, chComment] = data[i];
      
      if (String(month) === evalMonthStr && chId === channelId) {
        evaluations[memberId] = {
          mm: mm,
          contribution1: contribution1,
          achievement: achievement,
          comment1: comment1
        };
        
        // 채널 코멘트 저장 (첫 번째 행에서만)
        if (!channelComment && chComment) {
          channelComment = chComment;
        }
      }
    }
    
    evaluations.channelComment = channelComment;
    return evaluations;
  } catch (error) {
    console.error('기존 평가 데이터 가져오기 오류:', error);
    return {};
  }
}

// ===== 관리 기능 함수들 =====
function addMember(memberData) {
  try {
    const sheet = ss.getSheetByName(SHEET_NAMES.MEMBERS);
    const lastRow = sheet.getLastRow();
    
    const newId = 'M' + String(lastRow).padStart(3, '0');
    
    sheet.getRange(lastRow + 1, 1, 1, 4).setValues([[
      newId,
      memberData.name,
      memberData.teamId,
      'Y'
    ]]);
    
    return { success: true, memberId: newId, message: '팀원이 추가되었습니다.' };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

function deleteMember(memberId) {
  try {
    const sheet = ss.getSheetByName(SHEET_NAMES.MEMBERS);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === memberId) {
        sheet.getRange(i + 1, 4).setValue('N');
        break;
      }
    }
    
    const mapSheet = ss.getSheetByName(SHEET_NAMES.MEMBER_CHANNEL_MAP);
    const mapData = mapSheet.getDataRange().getValues();
    
    for (let i = 1; i < mapData.length; i++) {
      if (mapData[i][0] === memberId) {
        mapSheet.getRange(i + 1, 3).setValue('N');
      }
    }
    
    return { success: true, message: '팀원이 삭제되었습니다.' };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

function addChannel(channelData) {
  try {
    const sheet = ss.getSheetByName(SHEET_NAMES.CHANNELS);
    const lastRow = sheet.getLastRow();
    
    const newId = 'CH' + String(lastRow).padStart(3, '0');
    
    sheet.getRange(lastRow + 1, 1, 1, 4).setValues([[
      newId,
      channelData.name,
      channelData.teamId,
      'Y'
    ]]);
    
    return { success: true, channelId: newId, message: '채널이 추가되었습니다.' };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

function deleteChannel(channelId) {
  try {
    const sheet = ss.getSheetByName(SHEET_NAMES.CHANNELS);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === channelId) {
        sheet.getRange(i + 1, 4).setValue('N');
        break;
      }
    }
    
    const mapSheet = ss.getSheetByName(SHEET_NAMES.MEMBER_CHANNEL_MAP);
    const mapData = mapSheet.getDataRange().getValues();
    
    for (let i = 1; i < mapData.length; i++) {
      if (mapData[i][1] === channelId) {
        mapSheet.getRange(i + 1, 3).setValue('N');
      }
    }
    
    return { success: true, message: '채널이 삭제되었습니다.' };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

function updateChannelMembers(channelId, memberIds) {
  try {
    const mapSheet = ss.getSheetByName(SHEET_NAMES.MEMBER_CHANNEL_MAP);
    const data = mapSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === channelId) {
        mapSheet.getRange(i + 1, 3).setValue('N');
      }
    }
    
    memberIds.forEach(memberId => {
      let found = false;
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === memberId && data[i][1] === channelId) {
          mapSheet.getRange(i + 1, 3).setValue('Y');
          found = true;
          break;
        }
      }
      
      if (!found) {
        const lastRow = mapSheet.getLastRow();
        mapSheet.getRange(lastRow + 1, 1, 1, 3).setValues([[memberId, channelId, 'Y']]);
      }
    });
    
    return { success: true, message: '채널 멤버가 업데이트되었습니다.' };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

// ===== 평가 관련 함수들 =====
function saveFirstEvaluation(evaluationData) {
  try {
    const userInfo = checkPermission(1);
    
    // 팀장인 경우 자신의 팀 데이터만 저장 가능
    if (userInfo.level === 1) {
      // 평가 채널이 자신의 팀 채널인지 확인
      const teamChannels = getTeamChannels(userInfo.teamId);
      const teamChannelIds = teamChannels.map(ch => ch.id);
      
      if (!teamChannelIds.includes(evaluationData.channelId)) {
        throw new Error('자신의 팀 채널만 평가할 수 있습니다.');
      }
      
      // 평가자 ID가 본인인지 확인
      if (evaluationData.evaluatorId !== userInfo.teamleadId) {
        throw new Error('본인의 평가만 작성/수정할 수 있습니다.');
      }
    }
    
    const sheet = ss.getSheetByName(SHEET_NAMES.FIRST_EVAL);
    
    console.log('1차 평가 저장 시작:', evaluationData);
    
    // 기존 데이터 삭제
    const existingData = sheet.getDataRange().getValues();
    for (let i = existingData.length - 1; i > 0; i--) {
      if (String(existingData[i][0]) === String(evaluationData.evalMonth) && 
          existingData[i][1] === evaluationData.channelId &&
          existingData[i][10] === evaluationData.evaluatorId) {
        sheet.deleteRow(i + 1);
      }
    }
    
    // 새 데이터 추가
    const newRows = [];
    evaluationData.members.forEach(member => {
      newRows.push([
        String(evaluationData.evalMonth),
        evaluationData.channelId,
        evaluationData.channelName,
        member.id,
        member.name,
        member.teamName,
        member.mm,
        member.contribution1,
        member.achievement,
        member.comment1,
        evaluationData.evaluatorId,
        evaluationData.channelComment || '' // 채널 코멘트 추가
      ]);
    });
    
    if (newRows.length > 0) {
      sheet.getRange(sheet.getLastRow() + 1, 1, newRows.length, 12).setValues(newRows);
      console.log('저장된 행 수:', newRows.length);
    }
    
    logAction('1차 평가 저장', `${evaluationData.evalMonth} - ${evaluationData.channelName}`);
    
    return { success: true, message: '1차 평가가 저장되었습니다.' };
  } catch (error) {
    console.error('1차 평가 저장 오류:', error);
    return { success: false, message: error.toString() };
  }
}

// ===== 1차 평가 데이터 조회 수정 =====
function getFirstEvaluationData(evalMonth = null) {
  try {
    const sheet = ss.getSheetByName(SHEET_NAMES.FIRST_EVAL);
    if (!sheet) {
      console.error('1차평가 시트를 찾을 수 없습니다');
      return {};
    }
    
    const data = sheet.getDataRange().getValues();
    const targetMonth = evalMonth || new Date().toISOString().slice(0, 7);
    
    console.log('1차 평가 조회 - 대상월:', targetMonth);
    
    const evaluations = {};
    
    for (let i = 1; i < data.length; i++) {
      const [month, channelId, channelName, memberId, memberName, teamName, mm, contribution1, achievement, comment1, evaluatorId, channelComment] = data[i];
      
      const monthStr = String(month);
      const targetMonthStr = String(targetMonth);
      
      if (monthStr === targetMonthStr) {
        if (!evaluations[channelId]) {
          evaluations[channelId] = {
            channelId: channelId,
            channelName: channelName,
            channelComment: channelComment || '', // 채널 코멘트 추가
            members: []
          };
        }
        
        evaluations[channelId].members.push({
          id: memberId,
          name: memberName,
          teamName: teamName,
          mm: mm,
          contribution1: contribution1,
          achievement: achievement,
          comment1: comment1
        });
      }
    }
    
    console.log('1차 평가 결과:', JSON.stringify(evaluations));
    return evaluations;
  } catch (error) {
    console.error('1차 평가 데이터 가져오기 오류:', error);
    return {};
  }
}

// ===== 2차 평가 데이터 조회 수정 =====
function getSecondEvaluationData(evalMonth = null) {
  try {
    const userInfo = checkPermission(2); // 2차 평가 권한 필요
    const sheet = ss.getSheetByName(SHEET_NAMES.SECOND_EVAL);
    const data = sheet.getDataRange().getValues();
    const targetMonth = String(evalMonth || new Date().toISOString().slice(0, 7));
    
    console.log('2차 평가 조회 - 대상월:', targetMonth);
    
    const evaluations = {};
    
    for (let i = 1; i < data.length; i++) {
      const [month, channelId, channelName, memberId, memberName, teamName, mm, contribution1, contribution2, achievement, comment1, comment2, channelComment] = data[i];
      
      if (String(month) === targetMonth) {
        // 레벨 1 사용자는 자신의 팀 채널만 조회 가능
        if (userInfo.level === 1 && userInfo.teamId) {
          const channel = getChannelsData().find(ch => ch.id === channelId);
          if (!channel || channel.teamId !== userInfo.teamId) {
            continue;
          }
        }
        
        if (!evaluations[channelId]) {
          evaluations[channelId] = {
            channelId: channelId,
            channelName: channelName,
            channelComment: channelComment || '', // 채널 코멘트 추가
            members: []
          };
        }
        
        evaluations[channelId].members.push({
          id: memberId,
          name: memberName,
          teamName: teamName,
          mm: mm,
          contribution1: contribution1,
          contribution2: contribution2,
          achievement: achievement,
          comment1: comment1,
          comment2: comment2
        });
      }
    }
    
    console.log('2차 평가 결과:', evaluations);
    return evaluations;
  } catch (error) {
    console.error('2차 평가 데이터 가져오기 오류:', error);
    return {};
  }
}

// ===== 3차 평가용 통합 데이터 조회 =====
function getFinalEvaluationDetailData(evalMonth) {
  try {
    const targetMonth = String(evalMonth || new Date().toISOString().slice(0, 7));
    
    // 2차 평가 데이터 가져오기
    const secondEval = getSecondEvaluationData(targetMonth);
    
    return secondEval;
  } catch (error) {
    console.error('최종 평가 상세 데이터 조회 오류:', error);
    return {};
  }
}

// ===== 디버깅용 함수 추가 =====
function checkDataStatus() {
  const sheets = [SHEET_NAMES.FIRST_EVAL, SHEET_NAMES.SECOND_EVAL, SHEET_NAMES.EVAL_INFO];
  const result = {};
  
  sheets.forEach(sheetName => {
    const sheet = ss.getSheetByName(sheetName);
    const data = sheet.getDataRange().getValues();
    result[sheetName] = {
      rows: data.length,
      sample: data.slice(0, 3)
    };
  });
  
  return result;
}

function debugFirstEvaluation(evalMonth) {
  const sheet = ss.getSheetByName(SHEET_NAMES.FIRST_EVAL);
  const data = sheet.getDataRange().getValues();
  const result = {
    totalRows: data.length - 1,
    targetMonth: evalMonth,
    matchingRows: [],
    allMonths: []
  };
  
  for (let i = 1; i < data.length; i++) {
    const month = String(data[i][0]);
    result.allMonths.push(month);
    
    if (month === evalMonth) {
      result.matchingRows.push({
        month: month,
        channelId: data[i][1],
        channelName: data[i][2],
        memberName: data[i][4],
        channelComment: data[i][11] || ''
      });
    }
  }
  
  result.uniqueMonths = [...new Set(result.allMonths)];
  return result;
}

function getFirstEvaluationByTeamlead(evalMonth, teamleadId) {
  try {
    const sheet = ss.getSheetByName(SHEET_NAMES.FIRST_EVAL);
    const data = sheet.getDataRange().getValues();
    
    const evalMonthStr = String(evalMonth);
    
    const evaluations = {};
    const channelSet = new Set();
    
    for (let i = 1; i < data.length; i++) {
      const [month, channelId, channelName, memberId, memberName, teamName, mm, contribution1, achievement, comment1, evaluatorId, channelComment] = data[i];
      
      if (String(month) === evalMonthStr && evaluatorId === teamleadId) {
        channelSet.add(channelId);
        
        if (!evaluations[channelId]) {
          evaluations[channelId] = {
            channelId: channelId,
            channelName: channelName,
            channelComment: channelComment || '', // 채널 코멘트 추가
            members: []
          };
        }
        
        evaluations[channelId].members.push({
          id: memberId,
          name: memberName,
          teamName: teamName,
          mm: mm,
          contribution1: contribution1,
          achievement: achievement,
          comment1: comment1
        });
      }
    }
    
    return {
      evaluations: evaluations,
      evaluatedChannels: Array.from(channelSet)
    };
  } catch (error) {
    console.error('팀장별 평가 데이터 가져오기 오류:', error);
    return { evaluations: {}, evaluatedChannels: [] };
  }
}

function saveSecondEvaluation(evaluationData) {
  try {
    checkPermission(2); // 2차 평가 권한 필요
    
    const sheet = ss.getSheetByName(SHEET_NAMES.SECOND_EVAL);
    const evalMonth = String(evaluationData.evalMonth || new Date().toISOString().slice(0, 7));
    
    // 기존 데이터 삭제
    const existingData = sheet.getDataRange().getValues();
    for (let i = existingData.length - 1; i > 0; i--) {
      if (String(existingData[i][0]) === evalMonth) {
        sheet.deleteRow(i + 1);
      }
    }
    
    // 새 데이터 추가
    const newRows = [];
    for (const channelId in evaluationData.channels) {
      const channel = evaluationData.channels[channelId];
      channel.members.forEach(member => {
        newRows.push([
          evalMonth,
          channel.channelId,
          channel.channelName,
          member.id,
          member.name,
          member.teamName,
          member.mm,
          member.contribution1,
          member.contribution2,
          member.achievement,
          member.comment1,
          member.comment2,
          channel.channelComment || '' // 채널 코멘트 추가
        ]);
      });
    }
    
    if (newRows.length > 0) {
      sheet.getRange(sheet.getLastRow() + 1, 1, newRows.length, 13).setValues(newRows);
    }
    
    logAction('2차 평가 저장', `${evalMonth}`);
    
    return { success: true, message: '2차 평가가 저장되었습니다.' };
  } catch (error) {
    console.error('2차 평가 저장 오류:', error);
    return { success: false, message: error.toString() };
  }
}

function saveFinalEvaluation(channelData) {
  try {
    checkPermission(3); // 최종 평가 권한 필요
    
    const sheet = ss.getSheetByName(SHEET_NAMES.FINAL_EVAL);
    const evalMonth = String(channelData.evalMonth || new Date().toISOString().slice(0, 7));
    const timestamp = new Date().toLocaleString('ko-KR');
    
    // 기존 데이터 삭제
    const existingData = sheet.getDataRange().getValues();
    for (let i = existingData.length - 1; i > 0; i--) {
      if (String(existingData[i][0]) === evalMonth) {
        sheet.deleteRow(i + 1);
      }
    }
    
    // 새 데이터 추가
    const newRows = [];
    for (const channelId in channelData.channels) {
      const channel = channelData.channels[channelId];
      const distributionAmount = channel.totalAmount * (100 - channel.leaderPercentage) / 100;
      
      channel.members.forEach(member => {
        const calcAmount = distributionAmount * member.contribution2 / 100;
        newRows.push([
          evalMonth,
          channelId,
          channel.channelName,
          member.id,
          member.name,
          member.teamName,
          member.contribution2,
          channel.totalAmount,
          channel.leaderPercentage,
          distributionAmount,
          Math.round(calcAmount),
          member.finalAmount,
          timestamp
        ]);
      });
    }
    
    if (newRows.length > 0) {
      sheet.getRange(sheet.getLastRow() + 1, 1, newRows.length, 13).setValues(newRows);
    }
    
    logAction('최종 평가 확정', `${evalMonth} - ${newRows.length}건`);
    
    return { success: true, message: '최종 평가가 확정되었습니다.' };
  } catch (error) {
    console.error('최종 평가 저장 오류:', error);
    return { success: false, message: error.toString() };
  }
}

// ===== 액션 로그 조회 =====
function getActionLogs(limit = 50) {
  try {
    checkPermission(3); // 최고 권한 필요
    
    const sheet = ss.getSheetByName(SHEET_NAMES.ACTION_LOG);
    const data = sheet.getDataRange().getValues();
    const logs = [];
    
    // 최근 로그부터 표시 (역순)
    const startIndex = Math.max(1, data.length - limit);
    for (let i = data.length - 1; i >= startIndex; i--) {
      logs.push({
        timestamp: data[i][0],
        user: data[i][1],
        action: data[i][2],
        details: data[i][3],
        ip: data[i][4] || '-'
      });
    }
    
    return logs;
  } catch (error) {
    console.error('액션 로그 조회 오류:', error);
    return [];
  }
}

// ===== 초기 데이터 로드 함수 수정 =====
function getInitialData() {
  try {
    const userEmail = Session.getActiveUser().getEmail();
    if (!userEmail || !userEmail.endsWith('@awesomeent.kr')) {
      throw new Error('유효하지 않은 사용자입니다.');
    }
    
    const teams = getTeamsData();
    const members = getMembersData();
    const channels = getChannelsData();
    const teamleads = getTeamLeadsData();
    
    const userInfo = getUserPermission(userEmail);
    
    if (!userInfo) {
      throw new Error('사용자 권한 정보를 찾을 수 없습니다.');
    }
    
    // 레벨 1 사용자는 자신의 팀 데이터만 볼 수 있음
    let filteredData = {
      teams: teams,
      members: members,
      channels: channels,
      teamleads: teamleads,
      currentUser: userInfo
    };
    
    if (userInfo.level === 1 && userInfo.teamId) {
      filteredData.channels = channels.filter(ch => ch.teamId === userInfo.teamId);
      filteredData.members = members.filter(m => m.teamId === userInfo.teamId);
      // 자신의 팀장 정보만
      filteredData.teamleads = teamleads.filter(tl => tl.id === userInfo.teamleadId);
    }
    
    return filteredData;
  } catch (error) {
    console.error('초기 데이터 로드 오류:', error);
    throw error;
  }
}

// ===== 전월 비교 데이터 조회 함수 수정 =====
function getComparisonData(evalMonth, isTeamOnly = false) {
  try {
    const userInfo = checkPermission(1); // 최소 1차 평가 권한 필요
    const monthStr = String(evalMonth);
    
    // 1차/2차 평가 데이터
    const evaluations = {};
    const firstEvalSheet = ss.getSheetByName(SHEET_NAMES.FIRST_EVAL);
    const firstEvalData = firstEvalSheet.getDataRange().getValues();
    
    for (let i = 1; i < firstEvalData.length; i++) {
      const [month, channelId, channelName, memberId, memberName, teamName, mm, contribution1, achievement, comment1, evaluatorId, channelComment] = firstEvalData[i];
      
      if (String(month) === monthStr) {
        // 팀 필터링 (레벨 1이고 팀 전용 모드인 경우)
        if (isTeamOnly && userInfo.level === 1 && userInfo.teamId) {
          const channel = getChannelsData().find(ch => ch.id === channelId);
          if (!channel || channel.teamId !== userInfo.teamId) {
            continue;
          }
        }
        
        if (!evaluations[channelId]) {
          evaluations[channelId] = {
            channelId: channelId,
            channelName: channelName,
            channelComment: channelComment || '',
            members: []
          };
        }
        
        evaluations[channelId].members.push({
          id: memberId,
          name: memberName,
          teamName: teamName,
          mm: mm,
          contribution1: contribution1,
          achievement: achievement,
          comment1: comment1
        });
      }
    }
    
    // 최종 평가 데이터
    const finalSheet = ss.getSheetByName(SHEET_NAMES.FINAL_EVAL);
    const finalData = finalSheet.getDataRange().getValues();
    const finalEval = {};
    
    for (let i = 1; i < finalData.length; i++) {
      const [month, channelId, channelName, memberId, memberName, teamName, 
             contribution2, totalAmount, leaderPercentage, distributionAmount, 
             calcAmount, finalAmount, timestamp] = finalData[i];
      
      if (String(month) === monthStr) {
        // 팀 필터링
        if (isTeamOnly && userInfo.level === 1 && userInfo.teamId) {
          const channel = getChannelsData().find(ch => ch.id === channelId);
          if (!channel || channel.teamId !== userInfo.teamId) {
            continue;
          }
        }
        
        if (!finalEval[channelId]) {
          finalEval[channelId] = {
            channelName: channelName,
            totalAmount: totalAmount,
            members: {}
          };
        }
        finalEval[channelId].members[memberId] = finalAmount;
      }
    }
    
    return {
      evaluations: evaluations,
      finalEval: finalEval
    };
  } catch (error) {
    console.error('비교 데이터 조회 오류:', error);
    return { evaluations: {}, finalEval: {} };
  }
}

function logAction(action, details) {
  try {
    const sheet = ss.getSheetByName(SHEET_NAMES.ACTION_LOG);
    const userEmail = Session.getActiveUser().getEmail();
    
    sheet.appendRow([
      new Date().toLocaleString('ko-KR'),
      userEmail,
      action,
      details,
      '' // IP 주소는 Apps Script에서 직접 가져올 수 없음
    ]);
  } catch (error) {
    console.error('액션 로그 기록 실패:', error);
  }
}

// ===== 권한 관리 UI 함수들 =====
function getPermissionsList() {
  try {
    checkPermission(3); // 최고 권한 필요
    
    const sheet = ss.getSheetByName(SHEET_NAMES.USER_PERMISSIONS);
    const data = sheet.getDataRange().getValues();
    const permissions = [];
    
    for (let i = 1; i < data.length; i++) {
      permissions.push({
        email: data[i][0],
        name: data[i][1],
        department: data[i][2],
        level: data[i][3],
        active: data[i][4],
        registeredDate: data[i][5]
      });
    }
    
    return permissions;
  } catch (error) {
    console.error('권한 목록 조회 오류:', error);
    return [];
  }
}

function addUserPermission(userData) {
  try {
    checkPermission(3); // 최고 권한 필요
    
    const sheet = ss.getSheetByName(SHEET_NAMES.USER_PERMISSIONS);
    
    // 중복 확인
    const existingData = sheet.getDataRange().getValues();
    for (let i = 1; i < existingData.length; i++) {
      if (existingData[i][0] === userData.email) {
        return { success: false, message: '이미 등록된 이메일입니다.' };
      }
    }
    
    sheet.appendRow([
      userData.email,
      userData.name,
      userData.department,
      userData.level,
      'Y',
      new Date().toLocaleString('ko-KR')
    ]);
    
    logAction('권한 추가', `${userData.email} - 레벨 ${userData.level}`);
    
    return { success: true, message: '사용자 권한이 추가되었습니다.' };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

function updateUserPermission(email, newLevel) {
  try {
    checkPermission(3); // 최고 권한 필요
    
    const sheet = ss.getSheetByName(SHEET_NAMES.USER_PERMISSIONS);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === email) {
        sheet.getRange(i + 1, 4).setValue(newLevel);
        logAction('권한 수정', `${email} - 레벨 ${newLevel}`);
        return { success: true, message: '권한이 수정되었습니다.' };
      }
    }
    
    return { success: false, message: '사용자를 찾을 수 없습니다.' };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

function toggleUserActive(email) {
  try {
    checkPermission(3); // 최고 권한 필요
    
    const sheet = ss.getSheetByName(SHEET_NAMES.USER_PERMISSIONS);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === email) {
        const currentStatus = data[i][4];
        const newStatus = currentStatus === 'Y' ? 'N' : 'Y';
        sheet.getRange(i + 1, 5).setValue(newStatus);
        logAction('권한 상태 변경', `${email} - ${newStatus === 'Y' ? '활성화' : '비활성화'}`);
        return { success: true, message: `사용자가 ${newStatus === 'Y' ? '활성화' : '비활성화'}되었습니다.` };
      }
    }
    
    return { success: false, message: '사용자를 찾을 수 없습니다.' };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}
