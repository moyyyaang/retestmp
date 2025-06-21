// ===== 웹앱 기본 설정 =====
function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
      .setTitle('성과 평가 시스템')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
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
  FINAL_EVAL: '최종평가'
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
    teamleadSheet.getRange(1, 1, 1, 4).setValues([['팀장ID', '팀장명', '담당팀ID', '활성상태']]);
    const teamleads = [
      ['TL001', '김팀장', 'team1', 'Y'],
      ['TL002', '이팀장', 'team2', 'Y'],
      ['TL003', '박팀장', 'team3', 'Y'],
      ['TL004', '최팀장', 'team4', 'Y'],
      ['TL005', '정팀장', 'team5', 'Y']
    ];
    teamleadSheet.getRange(2, 1, teamleads.length, 4).setValues(teamleads);
  }
  
  // 평가정보 시트
  let evalInfoSheet = ss.getSheetByName(SHEET_NAMES.EVAL_INFO);
  if (!evalInfoSheet) {
    evalInfoSheet = ss.insertSheet(SHEET_NAMES.EVAL_INFO);
    evalInfoSheet.getRange(1, 1, 1, 6).setValues([['평가ID', '평가월', '팀장ID', '팀장명', '평가단계', '최종수정일시']]);
  }
  
  // 평가 시트들
  let firstEvalSheet = ss.getSheetByName(SHEET_NAMES.FIRST_EVAL);
  if (!firstEvalSheet) {
    firstEvalSheet = ss.insertSheet(SHEET_NAMES.FIRST_EVAL);
    firstEvalSheet.getRange(1, 1, 1, 11).setValues([['평가월', '채널ID', '채널명', '팀원ID', '팀원명', '팀명', '투입MM', '1차기여도', '핵심성과', '1차코멘트', '평가자ID']]);
  }
  
  let secondEvalSheet = ss.getSheetByName(SHEET_NAMES.SECOND_EVAL);
  if (!secondEvalSheet) {
    secondEvalSheet = ss.insertSheet(SHEET_NAMES.SECOND_EVAL);
    secondEvalSheet.getRange(1, 1, 1, 12).setValues([['평가월', '채널ID', '채널명', '팀원ID', '팀원명', '팀명', '투입MM', '1차기여도', '2차기여도', '핵심성과', '1차코멘트', '2차코멘트']]);
  }
  
  let finalEvalSheet = ss.getSheetByName(SHEET_NAMES.FINAL_EVAL);
  if (!finalEvalSheet) {
    finalEvalSheet = ss.insertSheet(SHEET_NAMES.FINAL_EVAL);
    finalEvalSheet.getRange(1, 1, 1, 13).setValues([['평가월', '채널ID', '채널명', '팀원ID', '팀원명', '팀명', '2차기여도', '1차성과금총액', '팀장성과율', '2차성과금(배분대상)', '기여도성과금', '실지급성과금', '최종확정일시']]);
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
      const [teamleadId, teamleadName, teamId, active] = data[i];
      if (active === 'Y') {
        teamleads.push({
          id: teamleadId,
          name: teamleadName,
          teamId: teamId
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

// ===== 평가 정보 관리 =====
function getEvaluationInfo(evalMonth, teamleadId) {
  try {
    const sheet = ss.getSheetByName(SHEET_NAMES.EVAL_INFO);
    const data = sheet.getDataRange().getValues();
    
    for (let i = data.length - 1; i > 0; i--) {
      if (data[i][1] === evalMonth && data[i][2] === teamleadId) {
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
    
    const data = sheet.getDataRange().getValues();
    let rowToUpdate = -1;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === evalMonth && data[i][2] === teamleadId) {
        rowToUpdate = i + 1;
        break;
      }
    }
    
    if (rowToUpdate > 0) {
      sheet.getRange(rowToUpdate, 5, 1, 2).setValues([[evalStage, timestamp]]);
    } else {
      sheet.appendRow([evalId, evalMonth, teamleadId, teamleadName, evalStage, timestamp]);
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
    
    const evaluations = {};
    
    for (let i = 1; i < data.length; i++) {
      const [month, chId, channelName, memberId, memberName, teamName, mm, contribution1, achievement, comment1] = data[i];
      
      if (month === evalMonth && chId === channelId) {
        evaluations[memberId] = {
          mm: mm,
          contribution1: contribution1,
          achievement: achievement,
          comment1: comment1
        };
      }
    }
    
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
    const sheet = ss.getSheetByName(SHEET_NAMES.FIRST_EVAL);
    
    // 기존 데이터 삭제 (같은 월, 같은 채널, 같은 평가자)
    const existingData = sheet.getDataRange().getValues();
    for (let i = existingData.length - 1; i > 0; i--) {
      if (existingData[i][0] === evaluationData.evalMonth && 
          existingData[i][1] === evaluationData.channelId &&
          existingData[i][10] === evaluationData.evaluatorId) {
        sheet.deleteRow(i + 1);
      }
    }
    
    // 새 데이터 추가
    const newRows = [];
    evaluationData.members.forEach(member => {
      newRows.push([
        evaluationData.evalMonth,
        evaluationData.channelId,
        evaluationData.channelName,
        member.id,
        member.name,
        member.teamName,
        member.mm,
        member.contribution1,
        member.achievement,
        member.comment1,
        evaluationData.evaluatorId
      ]);
    });
    
    if (newRows.length > 0) {
      sheet.getRange(sheet.getLastRow() + 1, 1, newRows.length, 11).setValues(newRows);
    }
    
    return { success: true, message: '1차 평가가 저장되었습니다.' };
  } catch (error) {
    console.error('1차 평가 저장 오류:', error);
    return { success: false, message: error.toString() };
  }
}

function getFirstEvaluationData(evalMonth = null) {
  try {
    const sheet = ss.getSheetByName(SHEET_NAMES.FIRST_EVAL);
    const data = sheet.getDataRange().getValues();
    const targetMonth = evalMonth || new Date().toISOString().slice(0, 7);
    
    const evaluations = {};
    
    for (let i = 1; i < data.length; i++) {
      const [month, channelId, channelName, memberId, memberName, teamName, mm, contribution1, achievement, comment1] = data[i];
      
      if (month === targetMonth) {
        if (!evaluations[channelId]) {
          evaluations[channelId] = {
            channelId: channelId,
            channelName: channelName,
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
    
    return evaluations;
  } catch (error) {
    console.error('1차 평가 데이터 가져오기 오류:', error);
    return {};
  }
}

function getFirstEvaluationByTeamlead(evalMonth, teamleadId) {
  try {
    const sheet = ss.getSheetByName(SHEET_NAMES.FIRST_EVAL);
    const data = sheet.getDataRange().getValues();
    
    const evaluations = {};
    const channelSet = new Set();
    
    for (let i = 1; i < data.length; i++) {
      const [month, channelId, channelName, memberId, memberName, teamName, mm, contribution1, achievement, comment1, evaluatorId] = data[i];
      
      if (month === evalMonth && evaluatorId === teamleadId) {
        channelSet.add(channelId);
        
        if (!evaluations[channelId]) {
          evaluations[channelId] = {
            channelId: channelId,
            channelName: channelName,
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
    const sheet = ss.getSheetByName(SHEET_NAMES.SECOND_EVAL);
    const evalMonth = evaluationData.evalMonth || new Date().toISOString().slice(0, 7);
    
    // 기존 데이터 삭제
    const existingData = sheet.getDataRange().getValues();
    for (let i = existingData.length - 1; i > 0; i--) {
      if (existingData[i][0] === evalMonth) {
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
          member.comment2
        ]);
      });
    }
    
    if (newRows.length > 0) {
      sheet.getRange(sheet.getLastRow() + 1, 1, newRows.length, 12).setValues(newRows);
    }
    
    return { success: true, message: '2차 평가가 저장되었습니다.' };
  } catch (error) {
    console.error('2차 평가 저장 오류:', error);
    return { success: false, message: error.toString() };
  }
}

function getSecondEvaluationData(evalMonth = null) {
  try {
    const sheet = ss.getSheetByName(SHEET_NAMES.SECOND_EVAL);
    const data = sheet.getDataRange().getValues();
    const targetMonth = evalMonth || new Date().toISOString().slice(0, 7);
    
    const evaluations = {};
    
    for (let i = 1; i < data.length; i++) {
      const [month, channelId, channelName, memberId, memberName, teamName, mm, contribution1, contribution2, achievement, comment1, comment2] = data[i];
      
      if (month === targetMonth) {
        if (!evaluations[channelId]) {
          evaluations[channelId] = {
            channelId: channelId,
            channelName: channelName,
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
    
    return evaluations;
  } catch (error) {
    console.error('2차 평가 데이터 가져오기 오류:', error);
    return {};
  }
}

function saveFinalEvaluation(channelData) {
  try {
    const sheet = ss.getSheetByName(SHEET_NAMES.FINAL_EVAL);
    const evalMonth = channelData.evalMonth || new Date().toISOString().slice(0, 7);
    const timestamp = new Date().toLocaleString('ko-KR');
    
    // 기존 데이터 삭제
    const existingData = sheet.getDataRange().getValues();
    for (let i = existingData.length - 1; i > 0; i--) {
      if (existingData[i][0] === evalMonth) {
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
    
    return { success: true, message: '최종 평가가 확정되었습니다.' };
  } catch (error) {
    console.error('최종 평가 저장 오류:', error);
    return { success: false, message: error.toString() };
  }
}

// ===== 초기 데이터 로드 =====
function getInitialData() {
  const teams = getTeamsData();
  const members = getMembersData();
  const channels = getChannelsData();
  const teamleads = getTeamLeadsData();
  
  return {
    teams: teams,
    members: members,
    channels: channels,
    teamleads: teamleads
  };
}

// ===== 샘플 데이터 생성 함수 =====
function setupSampleData() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  // 팀장정보 시트 생성
  let teamleadSheet = ss.getSheetByName('팀장정보');
  if (!teamleadSheet) {
    teamleadSheet = ss.insertSheet('팀장정보');
    teamleadSheet.getRange(1, 1, 1, 4).setValues([['팀장ID', '팀장명', '담당팀ID', '활성상태']]);
    const teamleads = [
      ['TL001', '김팀장', 'team1', 'Y'],
      ['TL002', '이팀장', 'team2', 'Y'],
      ['TL003', '박팀장', 'team3', 'Y'],
      ['TL004', '최팀장', 'team4', 'Y'],
      ['TL005', '정팀장', 'team5', 'Y']
    ];
    teamleadSheet.getRange(2, 1, teamleads.length, 4).setValues(teamleads);
  }
  
  // 평가정보 시트 생성
  let evalInfoSheet = ss.getSheetByName('평가정보');
  if (!evalInfoSheet) {
    evalInfoSheet = ss.insertSheet('평가정보');
    evalInfoSheet.getRange(1, 1, 1, 6).setValues([['평가ID', '평가월', '팀장ID', '팀장명', '평가단계', '최종수정일시']]);
  }
  
  // 헤더 스타일 적용
  const allSheets = ss.getSheets();
  allSheets.forEach(sheet => {
    const lastColumn = sheet.getLastColumn();
    if (lastColumn > 0) {
      const headerRange = sheet.getRange(1, 1, 1, lastColumn);
      headerRange.setBackground('#34495e');
      headerRange.setFontColor('#ffffff');
      headerRange.setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
  });
  
  return '샘플 데이터가 생성되었습니다.';
}
