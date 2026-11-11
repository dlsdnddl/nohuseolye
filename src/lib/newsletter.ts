// 뉴스레터 구독 이메일 저장
//  - 이메일을 Google 설문지로 전달하면, 설문지에 연결된 Google 스프레드시트에 한 줄씩 쌓입니다.
//  - 설문지 ID와 질문 ID는 비밀값이 아닙니다(공개 설문지 주소에 그대로 들어 있는 값).
//  - 설문지를 새로 만들면 아래 값만 바꾸면 됩니다.
export const NEWSLETTER_FORM = {
  // https://docs.google.com/forms/d/e/<formId>/viewform 의 <formId>
  formId: '1FAIpQLSfSC4Xkwl7AolDjusonBRyaMeQn6ZIQQLzvOOmTsivq9YjN3A',
  // 설문지 질문의 내부 ID (entry.숫자) — "이메일" 질문
  emailEntry: 'entry.1597222381',
  // 신청한 페이지 주소를 받는 질문 (없으면 빈 문자열) — "신청 페이지" 질문
  pageEntry: 'entry.1186399200',
}

export const isNewsletterConfigured = () => Boolean(NEWSLETTER_FORM.formId && NEWSLETTER_FORM.emailEntry)

export const isValidEmail = (email: string) => email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

// Google 설문지에 응답 1건을 제출합니다. 성공하면 true.
export async function submitNewsletterEmail(email: string, page: string): Promise<boolean> {
  const body = new URLSearchParams()
  body.set(NEWSLETTER_FORM.emailEntry, email)
  if (NEWSLETTER_FORM.pageEntry) body.set(NEWSLETTER_FORM.pageEntry, page)
  const res = await fetch(`https://docs.google.com/forms/d/e/${NEWSLETTER_FORM.formId}/formResponse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
  return res.ok
}
