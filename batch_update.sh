#!/bin/bash

# 처리할 파일 목록 (이미 완료된 파일 제외)
files=(
  "roleplay-conflict-discipline.html"
  "roleplay-consulting-sales.html"
  "roleplay-creator-branding.html"
  "roleplay-customer-success.html"
  "roleplay-debate-interview.html"
  "roleplay-doctor-explanation.html"
  "roleplay-education-counseling.html"
  "roleplay-executive-presentation.html"
  "roleplay-foreign-patient.html"
  "roleplay-global-buyer.html"
  "roleplay-global-pitch.html"
  "roleplay-government-grant.html"
  "roleplay-hospital-counselor.html"
  "roleplay-hospital.html"
  "roleplay-insurance.html"
  "roleplay-interview.html"
  "roleplay-labor.html"
  "roleplay-leadership-feedback.html"
  "roleplay-legal.html"
  "roleplay-live-commerce.html"
  "roleplay-ministry.html"
  "roleplay-poc-partnership.html"
  "roleplay-policy-announcement.html"
  "roleplay-politics.html"
  "roleplay-psychological-coaching.html"
  "roleplay-realestate.html"
  "roleplay-sales.html"
  "roleplay-startup.html"
  "roleplay-tax-accounting.html"
)

count=0
for file in "${files[@]}"; do
  if [[ -f "$file" ]]; then
    echo "Processing: $file"
    count=$((count + 1))
  fi
done

echo "Total files to process: $count"
